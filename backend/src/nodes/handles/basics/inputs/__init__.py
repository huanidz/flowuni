from .BooleanInputHandle import BooleanInputHandle
from .DropdownInputHandle import DropdownInputHandle
from .DynamicTypeInputHandle import DynamicTypeInputHandle
from .FileInputHandle import FileInputHandle
from .ImageInputInputHandle import ImageInputInputHandle
from .NumberInputHandle import NumberInputHandle
from .SecretTextInputHandle import SecretTextInputHandle
from .TableInputHandle import TableInputHandle
from .TextFieldInputHandle import TextFieldInputHandle
from .ToolableJsonInputHandle import ToolableJsonInputHandle

__all__ = [
    "BooleanInputHandle",
    "DropdownInputHandle",
    "FileInputHandle",
    "NumberInputHandle",
    "SecretTextInputHandle",
    "TextFieldInputHandle",
    "DynamicTypeInputHandle",
    "TableInputHandle",
    "ToolableJsonInputHandle",
    "ImageInputInputHandle",
]

from enum import Enum


class InputHandleTypeEnum(Enum):
    TEXT_FIELD = TextFieldInputHandle
    DROPDOWN = DropdownInputHandle
    NUMBER = NumberInputHandle
    FILE = FileInputHandle
    BOOLEAN = BooleanInputHandle
    SECRET_TEXT = SecretTextInputHandle
    DYNAMIC_TYPE = DynamicTypeInputHandle
    TABLE = TableInputHandle
    TOOLABLE_JSON = ToolableJsonInputHandle
    IMAGE = ImageInputInputHandle
