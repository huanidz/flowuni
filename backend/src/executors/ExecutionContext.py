import json
from datetime import datetime

import redis


class ExecutionContext:
    def __init__(self, redis_client: redis.Redis, flow_id: str, user_id: str):
        self.execution_id = f"{flow_id}-{user_id}"
        self.user_id = user_id
        self.redis: redis.Redis = redis_client

    def start(self):
        # Store execution context with 24h TTL
        pipeline = self.redis.pipeline()
        pipeline.setex(f"exec:{self.execution_id}:user", 86400, self.user_id)
        pipeline.setex(
            f"exec:{self.execution_id}:started", 86400, datetime.utcnow().isoformat()
        )
        pipeline.execute()

    def publish_node_event(self, node_id: str, event: str, data: dict):
        # Publish node event to Redis
        event = {
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.redis.publish(f"node:{node_id}", json.dumps(event))
