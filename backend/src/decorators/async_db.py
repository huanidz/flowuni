from functools import wraps

from src.dependencies.db_dependency import AsyncSessionLocal


def with_db_session(func):
    """
    Decorator that provides a db session to the function.
    The function should accept 'db' as first parameter after self.

    NOTE: Use this with care
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        async with AsyncSessionLocal() as db:
            try:
                # Inject db as first argument
                result = await func(db, *args, **kwargs)
                await db.commit()
                return result
            except Exception:
                await db.rollback()
                raise

    return wrapper
