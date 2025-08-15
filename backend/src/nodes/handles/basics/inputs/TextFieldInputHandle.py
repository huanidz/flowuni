from enum import Enum
from typing import Any, Dict, Optional

from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class TextFieldInputFormatEnum(str, Enum):
    PLAIN = "plain"
    JSON = "json"
    TOOLABLE_JSON = "toolable_json"


class TextFieldInputHandle(InputHandleTypeBase):
    """Handle for text field inputs"""

    placeholder: Optional[str] = None
    max_length: Optional[int] = None
    multiline: bool = False
    format: TextFieldInputFormatEnum = TextFieldInputFormatEnum.PLAIN

    def get_type_name(self) -> str:
        return "text_field"

    def validate_value(self, value: Any) -> bool:
        if not isinstance(value, str):
            return False
        if self.max_length and len(value) > self.max_length:
            return False
        return True

    def get_default_value(self) -> str:
        return ""

    def to_json_schema(self) -> Dict[str, Any]:
        schema = {
            "type": "text_field",
            "placeholder": self.placeholder,
            "multiline": self.multiline,
            "format": self.format.value,
        }
        if self.max_length:
            schema["max_length"] = self.max_length
        return schema
