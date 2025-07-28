import json
from datetime import datetime

import redis


class ExecutionContext:
    def __init__(self, task_id: str, redis_client: redis.Redis):
        self.task_id = task_id
        self.redis: redis.Redis = redis_client

    def end(self):
        # Publish DONE event to Redis
        event = {"event": "DONE", "timestamp": datetime.utcnow().isoformat()}
        self.redis.rpush(self.task_id, json.dumps(event))

    def publish_node_event(self, node_id: str, event: str, data: dict):
        # Publish node event to Redis
        event = {
            "node_id": node_id,
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Push to a Redis list keyed by task_id
        self.redis.rpush(self.task_id, json.dumps(event))
