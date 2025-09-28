from typing import Any, Dict, Literal, Optional

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
    test_run_data: Dict[
        str, Any
    ] = {}  # For future use. Current it consume too much data which can waste Redis memory. # noqa
    chat_output: Optional[str] = None
    error_message: Optional[str] = None
    execution_time_ms: Optional[float] = None


class RedisFlowTestRunEvent(BaseModel):
    seq: int
    task_id: str
    event_type: str
    payload: RedisFlowTestRunEventPayload
