from typing import Any, Dict

from src.nodes.handles.HandleBase import HandleTypeBase


class SecretTextInputHandle(HandleTypeBase):
    """Handle for secret text inputs"""

    multiline: bool = True
    allow_visible_toggle: bool = False

    def get_type_name(self) -> str:
        return "secret_text"

    def validate_value(self, value: Any) -> bool:
        if not isinstance(value, str):
            return False
        return True

    def get_default_value(self) -> str:
        return ""

    def to_json_schema(self) -> Dict[str, Any]:
        schema = {
            "type": "secret_text",
            "placeholder": self.placeholder,
            "multiline": self.multiline,
        }
        if self.max_length:
            schema["max_length"] = self.max_length
