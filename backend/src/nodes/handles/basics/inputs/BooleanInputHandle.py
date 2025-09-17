from typing import Any, Dict, Optional

from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class BooleanInputHandle(InputHandleTypeBase):
    """Handle for boolean/checkbox inputs"""

    label: Optional[str] = None

    def get_type_name(self) -> str:
        return "boolean"

    def validate_value(self, value: Any) -> bool:
        return isinstance(value, bool)

    def get_default_value(self) -> bool:
        return False

    def to_json_schema(self) -> Dict[str, Any]:
        return {
            "type": "boolean",
            "label": self.label,
            "hide_input_field": self.hide_input_field,
        }
