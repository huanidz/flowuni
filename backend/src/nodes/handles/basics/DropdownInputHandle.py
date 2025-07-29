from typing import Any, Dict, List, Union

from pydantic import Field
from src.nodes.handles.HandleBase import HandleTypeBase


class DropdownInputHandle(HandleTypeBase):
    """Handle for dropdown/select inputs"""

    options: List[Dict[str, Any]] = Field(default_factory=list)
    multiple: bool = False
    searchable: bool = False

    def get_type_name(self) -> str:
        return "dropdown"

    def validate_value(self, value: Any) -> bool:
        valid_values = [opt["value"] for opt in self.options]

        if self.multiple:
            if not isinstance(value, list):
                return False
            return all(v in valid_values for v in value)
        else:
            return value in valid_values

    def get_default_value(self) -> Union[str, List[str]]:
        if not self.options:
            return [] if self.multiple else ""

        # Find first option marked as default, or use first option
        default_option = next(
            (opt for opt in self.options if opt.get("default", False)), self.options[0]
        )

        return [default_option["value"]] if self.multiple else default_option["value"]

    def to_json_schema(self) -> Dict[str, Any]:
        return {
            "type": "dropdown",
            "options": self.options,
            "multiple": self.multiple,
            "searchable": self.searchable,
        }
