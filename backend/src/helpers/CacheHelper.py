"""
CacheHelper
-----------

Small utility class to standardize Redis cache operations:
- JSON (de)serialization
- TTL handling
- Logging
"""

import json
from typing import Optional, Type, TypeVar

from loguru import logger
from redis import Redis

T = TypeVar("T")


class CacheHelper:
    def __init__(self, redis_client: Optional[Redis], ttl: int = 3600):
        """
        :param redis_client: Redis client (can be None to disable caching)
        :param ttl: Default TTL in seconds (default: 1h)
        """
        self.redis_client = redis_client
        self.ttl = ttl

    def get(self, key: str, model_cls: Optional[Type[T]] = None) -> Optional[T]:
        """Get a cached item (deserialize to model_cls if given)."""
        if not self.redis_client:
            return None
        try:
            data = self.redis_client.get(key)
            if data:
                logger.debug(f"Cache hit: {key}")
                parsed = json.loads(data)
                return model_cls(**parsed) if model_cls else parsed
        except Exception as e:
            logger.warning(f"Cache get error [{key}]: {e}")
        return None

    def set(self, key: str, value: dict) -> None:
        """Set a cached item with TTL."""
        if not self.redis_client:
            return
        try:
            self.redis_client.setex(key, self.ttl, json.dumps(value))
            logger.debug(f"Cache set: {key}")
        except Exception as e:
            logger.warning(f"Cache set error [{key}]: {e}")

    def delete(self, key: str) -> None:
        """Delete a cached item."""
        if not self.redis_client:
            return
        try:
            self.redis_client.delete(key)
            logger.debug(f"Cache delete: {key}")
        except Exception as e:
            logger.warning(f"Cache delete error [{key}]: {e}")
