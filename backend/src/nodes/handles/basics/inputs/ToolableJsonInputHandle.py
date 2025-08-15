from typing import Any, Dict

from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class ToolableJsonInputHandle(InputHandleTypeBase):
    """Handle for text field inputs"""

    def get_type_name(self) -> str:
        return "toolable_json_field"

    def validate_value(self, value: Any) -> bool:
        pass

    def get_default_value(self) -> str:
        return ""

    def to_json_schema(self) -> Dict[str, Any]:
        pass
