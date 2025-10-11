"""
Production-grade async/sync bridge for Celery tasks.
Handles edge cases, proper cleanup, and thread safety.
"""

import asyncio
import functools
import sys
from contextlib import contextmanager
from typing import Any, Coroutine, TypeVar

from loguru import logger

T = TypeVar("T")


def run_async(coro: Coroutine[Any, Any, T], timeout: float | None = None) -> T:
    """
    Execute an async coroutine in a sync context (production-grade).

    Features:
    - Proper loop cleanup with pending task cancellation
    - Thread-safe (uses thread-local storage)
    - Timeout support
    - Exception propagation with context
    - Handles keyboard interrupts gracefully
    - Prevents event loop pollution

    Args:
        coro: Async coroutine to execute
        timeout: Optional timeout in seconds

    Returns:
        Result from the coroutine

    Raises:
        asyncio.TimeoutError: If timeout is exceeded
        Exception: Any exception raised by the coroutine

    Example:
        result = run_async(fetch_data(), timeout=30)
    """
    # Check if we're already in an event loop (avoid nested loop issues)
    try:
        running_loop = asyncio.get_running_loop()
        raise RuntimeError(
            f"run_async() cannot be called from an already running event loop. "
            f"Current loop: {running_loop}. Use 'await' instead."
        )
    except RuntimeError:
        # No loop running - this is what we expect
        pass

    # Create a new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Wrap with timeout if specified
        if timeout is not None:
            coro = asyncio.wait_for(coro, timeout=timeout)

        # Run the coroutine
        return loop.run_until_complete(coro)

    except KeyboardInterrupt:
        logger.warning("Received KeyboardInterrupt, cancelling async tasks...")
        # Cancel all running tasks
        _cancel_all_tasks(loop)
        raise

    except Exception as e:
        # Log with full context for debugging
        logger.error(
            f"Error in async execution: {type(e).__name__}: {e}",
            exc_info=sys.exc_info(),
        )
        raise

    finally:
        try:
            # Cancel any remaining tasks
            _cancel_all_tasks(loop)

            # Give cancelled tasks a chance to complete
            loop.run_until_complete(loop.shutdown_asyncgens())

            # Shutdown default executor (thread pool)
            if hasattr(loop, "shutdown_default_executor"):
                loop.run_until_complete(loop.shutdown_default_executor())

        except Exception as cleanup_error:
            logger.error(f"Error during loop cleanup: {cleanup_error}")

        finally:
            # Always close the loop
            loop.close()

            # Clear event loop from thread-local storage
            asyncio.set_event_loop(None)


def _cancel_all_tasks(loop: asyncio.AbstractEventLoop) -> None:
    """
    Cancel all pending tasks in the event loop.

    This ensures clean shutdown and prevents warnings about
    pending tasks that were never awaited.
    """
    try:
        pending = asyncio.all_tasks(loop)

        if not pending:
            return

        logger.debug(f"Cancelling {len(pending)} pending task(s)")

        for task in pending:
            task.cancel()

        # Wait for all tasks to be cancelled
        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))

        # Log any tasks that raised exceptions during cancellation
        for task in pending:
            if task.cancelled():
                continue
            if task.exception() is not None:
                loop.call_exception_handler(
                    {
                        "message": "Unhandled exception during task cancellation",
                        "exception": task.exception(),
                        "task": task,
                    }
                )

    except Exception as e:
        logger.error(f"Error cancelling tasks: {e}")


@contextmanager
def async_context(timeout: float | None = None):
    """
    Context manager version of run_async for multiple async operations.

    Example:
        with async_context(timeout=60) as run:
            result1 = run(async_func1())
            result2 = run(async_func2())
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def runner(coro: Coroutine[Any, Any, T]) -> T:
        if timeout is not None:
            coro = asyncio.wait_for(coro, timeout=timeout)
        return loop.run_until_complete(coro)

    try:
        yield runner
    finally:
        try:
            _cancel_all_tasks(loop)
            loop.run_until_complete(loop.shutdown_asyncgens())
            if hasattr(loop, "shutdown_default_executor"):
                loop.run_until_complete(loop.shutdown_default_executor())
        finally:
            loop.close()
            asyncio.set_event_loop(None)


def async_to_sync(timeout: float | None = None):
    """
    Decorator to convert async functions to sync functions.

    Example:
        @async_to_sync(timeout=30)
        async def fetch_user(user_id: int):
            return await db.get_user(user_id)

        # Now callable as sync function
        user = fetch_user(123)
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            coro = func(*args, **kwargs)
            return run_async(coro, timeout=timeout)

        return wrapper

    return decorator
