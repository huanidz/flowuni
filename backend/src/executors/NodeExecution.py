from enum import Enum


class NodeExecutionEvent(str, Enum):
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
