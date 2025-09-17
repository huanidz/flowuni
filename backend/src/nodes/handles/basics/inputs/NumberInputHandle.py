from typing import Any, Dict, Optional, Union

from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class NumberInputHandle(InputHandleTypeBase):
    """Handle for number inputs"""

    min_value: Optional[float] = None
    max_value: Optional[float] = None
    step: Optional[float] = None
    integer_only: bool = False

    def get_type_name(self) -> str:
        return "number"

    def validate_value(self, value: Any) -> bool:
        if not isinstance(value, (int, float)):
            return False

        if self.integer_only and not isinstance(value, int):
            return False

        if self.min_value is not None and value < self.min_value:
            return False

        if self.max_value is not None and value > self.max_value:
            return False

        return True

    def get_default_value(self) -> Union[int, float]:
        if self.min_value is not None:
            return int(self.min_value) if self.integer_only else self.min_value
        return 0

    def to_json_schema(self) -> Dict[str, Any]:
        schema = {
            "type": "number",
            "integer_only": self.integer_only,
            "hide_input_field": self.hide_input_field,
        }
        if self.min_value is not None:
            schema["min_value"] = self.min_value
        if self.max_value is not None:
            schema["max_value"] = self.max_value
        if self.step is not None:
            schema["step"] = self.step
        return schema
