import json
from datetime import datetime
from typing import Literal, Optional

import redis
from loguru import logger
from pydantic import BaseModel, Field
from src.models.events.RedisEvents import (
    RedisFlowRunEndEvent,
    RedisFlowRunNodeEvent,
    RedisFlowTestRunEvent,
    RedisFlowTestRunEventPayload,
)


class ExecutionControl(BaseModel):
    start_node: Optional[str] = None
    scope: Optional[Literal["node_only", "downstream"]] = Field(default="downstream")


class ExecutionEventPublisher:
    def __init__(
        self,
        user_id: int,
        task_id: str,
        redis_client: redis.Redis,
        is_test: bool = False,
    ):
        self.task_id = task_id
        self.redis: redis.Redis = redis_client
        self.is_test = is_test
        self.user_id = user_id

        self.seq = 0

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
        case_id: int,
        status: str,
    ):
        """
        Publish test run event to Redis Stream

        Args:
            test_case_id: ID of the test case being run
            status: Status of the test run (e.g., PENDING, RUNNING, PASSED, FAILED)
            data: Additional data to include in the event
            stream_name: Optional custom stream name, defaults to test_run_events:{task_id}
        """

        # CONSTS
        MAX_LEN = 100  # Temporary
        STREAM_TTL_SECONDS = 86400  # 24 hours expiry

        # Use provided stream name or create default one
        stream_name = f"user_events:{self.user_id}"

        test_run_event = RedisFlowTestRunEvent(
            seq=self.seq,
            task_id=self.task_id,
            event_type="TEST_CASE_STATUS_UPDATE",
            payload=RedisFlowTestRunEventPayload(case_id=case_id, status=status),
        )

        redis_message_json = test_run_event.model_dump_json()

        # retval: Invalid input of type: 'dict'. Convert to a bytes, string, int or float first.
        send_data = {"data": redis_message_json}

        # Check if stream exists to avoid resetting expiry
        stream_exists = self.redis.exists(stream_name)

        # Publish to Redis Stream
        self.redis.xadd(stream_name, send_data, maxlen=MAX_LEN)

        # Set expiry only if the stream didn't exist before
        if not stream_exists:
            logger.info(
                f"Setting expiry of {STREAM_TTL_SECONDS} seconds on new stream: {stream_name}"
            )
            self.redis.expire(stream_name, STREAM_TTL_SECONDS)

        # Advance sequence
        self.seq += 1
