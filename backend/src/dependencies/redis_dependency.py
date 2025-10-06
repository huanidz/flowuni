from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from src.configs.config import get_settings


def get_redis_client() -> Redis:
    """Get a synchronous Redis client instance.

    Returns:
        Redis: A synchronous Redis client configured with app settings.
    """
    app_settings = get_settings()

    return Redis(
        host=app_settings.REDIS_HOST,
        port=app_settings.REDIS_PORT,
        db=app_settings.REDIS_DB,
        decode_responses=True,
    )


async def get_async_redis() -> AsyncRedis:
    """Get an asynchronous Redis client instance.

    Returns:
        AsyncRedis: An asynchronous Redis client configured with app settings.
    """
    app_settings = get_settings()

    return AsyncRedis(
        host=app_settings.REDIS_HOST,
        port=app_settings.REDIS_PORT,
        db=app_settings.REDIS_DB,
        decode_responses=True,
    )
