"""Common decorators for the application."""

from functools import wraps
from typing import Any, Callable

from loguru import logger


def futureuse(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator to mark a function for future use.

    This decorator currently does nothing but wraps the function.
    It can be used to mark functions that are planned for future implementation
    or features.

    Args:
        func: The function to be decorated

    Returns:
        The wrapped function
    """

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        return func(*args, **kwargs)

    return wrapper


def deprecated(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator to mark a function as deprecated.

    This decorator wraps the function and logs a warning message
    whenever the function is called, indicating that it's deprecated.

    Args:
        func: The function to be decorated

    Returns:
        The wrapped function
    """

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        logger.warning(
            f"Function '{func.__name__}' is deprecated and may be removed in future versions."  # noqa
        )
        return func(*args, **kwargs)

    return wrapper
