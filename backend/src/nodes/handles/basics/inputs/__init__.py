from .BooleanInputHandle import BooleanInputHandle
from .DropdownInputHandle import DropdownInputHandle
from .DynamicTypeInputHandle import DynamicTypeInputHandle
from .EmbeddingProviderInputHandle import EmbeddingProviderInputHandle
from .FileInputHandle import FileInputHandle
from .ImageInputInputHandle import ImageInputInputHandle
from .KeyValueInputHandle import KeyValueInputHandle
from .LLMInputHandle import LLMProviderInputHandle
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
    "KeyValueInputHandle",
    "LLMProviderInputHandle",
    "EmbeddingProviderInputHandle",
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
    KEY_VALUE = KeyValueInputHandle
    LLM_PROVIDER = LLMProviderInputHandle
    EMBEDDING_PROVIDER = EmbeddingProviderInputHandle
