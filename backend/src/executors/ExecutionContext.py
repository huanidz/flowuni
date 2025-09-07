import json
from datetime import datetime
from typing import Literal, Optional

import redis
from pydantic import BaseModel, Field


class ExecutionControl(BaseModel):
    start_node: Optional[str] = None
    scope: Optional[Literal["node_only", "downstream"]] = Field(default="downstream")


class ExecutionContext:
    def __init__(self, task_id: str, redis_client: redis.Redis):
        self.task_id = task_id
        self.redis: redis.Redis = redis_client

    def end(self, data: dict = {}):
        # Publish DONE event to Redis
        redis_message = {
            "event": "DONE",
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.redis.rpush(self.task_id, json.dumps(redis_message))

    def publish_node_event(self, node_id: str, event: str, data: dict):
        # Publish node event to Redis
        redis_message = {
            "node_id": node_id,
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Push to a Redis list keyed by task_id
        self.redis.rpush(self.task_id, json.dumps(redis_message))
