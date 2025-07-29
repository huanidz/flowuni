from typing import Any, Dict

from src.nodes.handles.HandleBase import HandleTypeBase


class TextReceiverInputHandle(HandleTypeBase):
    """Handle for text field inputs"""

    def get_type_name(self) -> str:
        return "text_receiver"

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
            "type": "text_receiver",
            "placeholder": self.placeholder,
            "multiline": self.multiline,
        }
        if self.max_length:
            schema["max_length"] = self.max_length
        return schema
