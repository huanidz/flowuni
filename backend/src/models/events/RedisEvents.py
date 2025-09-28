from typing import Any, Dict, Literal

from pydantic import BaseModel


class RedisFlowRunEndEvent(BaseModel):
    event: Literal["DONE"]
    data: Dict[str, Any] = {}
    timestamp: str


class RedisFlowRunNodeEvent(BaseModel):
    node_id: str
    event: str
    data: Dict[str, Any] = {}
    timestamp: str


# === TEST EVENTS ===

"""
@ FlowTestCaseRunModel.py:
class TestCaseRunStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    SYSTEM_ERROR = "SYSTEM_ERROR
"""


class RedisFlowTestRunEventPayload(BaseModel):
    case_id: int
    status: Literal[
        "PENDING", "QUEUED", "RUNNING", "PASSED", "FAILED", "CANCELLED", "SYSTEM_ERROR"
    ]
    test_run_data: Dict[str, Any] = {}


class RedisFlowTestRunEvent(BaseModel):
    seq: int
    task_id: str
    event_type: str
    payload: RedisFlowTestRunEventPayload
