from redis import Redis
from src.configs.config import get_settings


def get_redis_client():
    app_settings = get_settings()

    return Redis(
        host=app_settings.REDIS_HOST,
        port=app_settings.REDIS_PORT,
        db=app_settings.REDIS_DB,
        decode_responses=True,
    )
