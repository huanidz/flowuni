import json
from datetime import datetime
from typing import Literal, Optional

import redis
from pydantic import BaseModel, Field
from src.models.events.RedisEvents import RedisFlowRunEndEvent, RedisFlowRunNodeEvent


class ExecutionControl(BaseModel):
    start_node: Optional[str] = None
    scope: Optional[Literal["node_only", "downstream"]] = Field(default="downstream")


class ExecutionEventPublisher:
    def __init__(self, task_id: str, redis_client: redis.Redis, is_test: bool = False):
        self.task_id = task_id
        self.redis: redis.Redis = redis_client
        self.is_test = is_test

    # === NON-TEST EVENT PUBLISH ===
    def end(self, data: dict = {}):
        # Publish DONE event to Redis
        redis_message = {
            "event": "DONE",
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        redis_message = RedisFlowRunEndEvent(**redis_message).model_dump()
        self.redis.rpush(self.task_id, json.dumps(redis_message))

    def publish_node_event(self, node_id: str, event: str, data: dict):
        # Publish node event to Redis
        redis_message = {
            "node_id": node_id,
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        redis_message = RedisFlowRunNodeEvent(**redis_message).model_dump()

        # Push to a Redis list keyed by task_id
        self.redis.rpush(self.task_id, json.dumps(redis_message))

    # === TEST EVENT PUBLISH ===
    def publish_test_run_event(
        self,
        test_case_id: int,
        status: str,
        data: dict = {},
        stream_name: Optional[str] = None,
    ):
        """
        Publish test run event to Redis Stream

        Args:
            test_case_id: ID of the test case being run
            status: Status of the test run (e.g., PENDING, RUNNING, PASSED, FAILED)
            data: Additional data to include in the event
            stream_name: Optional custom stream name, defaults to test_run_events:{task_id}
        """
        # Use provided stream name or create default one
        if stream_name is None:
            stream_name = f"test_run_events:{self.task_id}"

        # Create test run event message
        redis_message = {
            "event": "TEST_RUN",
            "test_case_id": str(test_case_id),
            "status": status,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Publish to Redis Stream
        self.redis.xadd(stream_name, redis_message)
