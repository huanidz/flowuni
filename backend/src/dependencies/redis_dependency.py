from redis import Redis
from src.configs.config import get_app_settings


def get_redis_client() -> Redis:
    app_settings = get_app_settings()

    return Redis(
        host=app_settings.REDIS_HOST,
        port=app_settings.REDIS_PORT,
        db=app_settings.REDIS_DB,
        decode_responses=True,
    )
