from .DataOutputHandle import DataOutputHandle
from .NumberOutputHandle import NumberOutputHandle
from .ToolOutputHandle import ToolOutputHandle

__all__ = [
    "DataOutputHandle",
    "ToolOutputHandle",
    "NumberOutputHandle",
]

from enum import Enum


class OutputHandleTypeEnum(Enum):
    DATA = DataOutputHandle
    TOOL = ToolOutputHandle
    NUMBER = NumberOutputHandle
