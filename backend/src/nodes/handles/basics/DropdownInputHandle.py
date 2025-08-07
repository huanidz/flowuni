from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, field_validator
from src.nodes.handles.HandleBase import HandleTypeBase


class DropdownOption(BaseModel):
    """Represents a single option in a dropdown."""

    label: str = Field(..., description="Display label for the option")
    value: str = Field(..., description="Value of the option")
    default: Optional[bool] = Field(
        default=None, description="Whether this option is selected by default"
    )


class DropdownInputHandle(HandleTypeBase):
    """Handle for dropdown/select inputs"""

    options: List[DropdownOption] = Field(default_factory=list)
    multiple: bool = False
    searchable: bool = False

    @field_validator("resolver", "client_resolver", mode="before")
    @classmethod
    def _validate_resolver_with_options(cls, v, info):
        """Ensure resolver and client_resolver are None when options are provided"""
        if info.data.get("options"):
            if v is not None:
                raise ValueError(
                    "resolver and client_resolver must be None when options are provided"  # noqa
                )
        return v

    def get_type_name(self) -> str:
        return "dropdown"

    def validate_value(self, value: Any) -> bool:
        valid_values = [opt.value for opt in self.options]

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
            (opt for opt in self.options if opt.default), self.options[0]
        )

        return [default_option.value] if self.multiple else default_option.value

    def to_json_schema(self) -> Dict[str, Any]:
        return {
            "type": "dropdown",
            "options": [opt.model_dump() for opt in self.options],
            "multiple": self.multiple,
            "searchable": self.searchable,
        }
