from .DataOutputHandle import DataOutputHandle
from .NumberOutputHandle import NumberOutputHandle
from .StringOutputHandle import StringOutputHandle
from .ToolOutputHandle import ToolOutputHandle

__all__ = [
    "DataOutputHandle",
    "ToolOutputHandle",
    "NumberOutputHandle",
    "StringOutputHandle",
]

from enum import Enum


class OutputHandleTypeEnum(Enum):
    DATA = DataOutputHandle
    TOOL = ToolOutputHandle
    NUMBER = NumberOutputHandle
    STRING = StringOutputHandle
