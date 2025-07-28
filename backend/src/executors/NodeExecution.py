from enum import Enum
from typing import Dict

from pydantic import BaseModel


class NodeExecutionStatus(str, Enum):
    RUNNING = "RUNNING"
    SUCCESS = "success"
    FAILED = "failed"


class NodeExecution(BaseModel):
    status: NodeExecutionStatus
    inputs: Dict[str, any]
    outputs: Dict[str, any]
    error: str
