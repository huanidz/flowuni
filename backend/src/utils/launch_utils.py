from loguru import logger
from redis.exceptions import ConnectionError as RedisConnectionError
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from src.dependencies.db_dependency import SessionLocal
from src.dependencies.redis_dependency import get_redis_client


def check_db_connection() -> bool:
    """
    Checks the database connection.

    Returns:
        bool: True if the connection is successful, False otherwise.
    """
    try:
        logger.info("Attempting to connect to the database...")
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection successful.")
        return True
    except OperationalError as e:
        logger.error(f"Database connection failed: {e}")
        return False
    except Exception as e:
        logger.error(
            f"An unexpected error occurred during database connection check: {e}"
        )
        return False


def check_redis_connection() -> bool:
    """
    Checks the Redis connection.

    Returns:
        bool: True if the connection is successful, False otherwise.
    """
    try:
        logger.info("Attempting to connect to Redis...")
        redis_client = get_redis_client()
        redis_client.ping()
        logger.info("Redis connection successful.")
        return True
    except RedisConnectionError as e:
        logger.error(f"Redis connection failed: {e}")
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred during Redis connection check: {e}")
        return False
