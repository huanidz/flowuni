from .DataOutputHandle import DataOutputHandle
from .ToolOutputHandle import ToolOutputHandle

__all__ = [
    "DataOutputHandle",
    "ToolOutputHandle",
]

from enum import Enum
from typing import Type


class OutputHandleTypeEnum(Type, Enum):
    DATA = DataOutputHandle
    TOOL = ToolOutputHandle
