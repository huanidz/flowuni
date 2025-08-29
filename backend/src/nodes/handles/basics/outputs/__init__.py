from .DataOutputHandle import DataOutputHandle
from .NumberOutputHandle import NumberOutputHandle
from .RouterOutputHandle import RouterOutputHandle
from .StringOutputHandle import StringOutputHandle
from .ToolOutputHandle import ToolOutputHandle

__all__ = [
    "DataOutputHandle",
    "ToolOutputHandle",
    "NumberOutputHandle",
    "StringOutputHandle",
    "RouterOutputHandle",
]

from enum import Enum


class OutputHandleTypeEnum(Enum):
    DATA = DataOutputHandle
    TOOL = ToolOutputHandle
    NUMBER = NumberOutputHandle
    STRING = StringOutputHandle
    ROUTER = RouterOutputHandle
