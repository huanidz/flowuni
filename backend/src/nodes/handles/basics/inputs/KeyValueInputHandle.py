from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class KVValueDType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"


class KeyValueItem(BaseModel):
    """Represents a single key-value pair"""

    key: str = Field(..., description="Key for the key-value pair")
    value: str = Field(..., description="Value for the key-value pair")
    dtype: KVValueDType = Field(
        default=KVValueDType.STRING, description="Data type for the value"
    )
    description: str = Field(
        default="", description="Description for the key-value pair"
    )
    required: bool = Field(
        default=False, description="Whether this key-value pair is required"
    )
    key_placeholder: Optional[str] = Field(
        default=None, description="Placeholder text for the key input"
    )
    value_placeholder: Optional[str] = Field(
        default=None, description="Placeholder text for the value input"
    )
    multiline: bool = Field(
        default=False, description="Whether the value input should be multiline"
    )


class KeyValueInputHandle(InputHandleTypeBase):
    """Handle for key-value pair inputs"""

    key_label: str = Field(default="Key", description="Label for the key input field")
    value_label: str = Field(
        default="Value", description="Label for the value input field"
    )
    fixed_items: List[KeyValueItem] = Field(
        default_factory=list,
        description="Fixed key-value items. If define, user only have to fill the value. You can not delete fixed items.",
    )
    predefined_items: List[KeyValueItem] = Field(
        default_factory=list,
        description="Predefined key-value items. You can delete predefined items.",
    )
    allow_custom_keys: bool = Field(
        default=True, description="Whether users can add custom keys"
    )
    allow_duplicate_keys: bool = Field(
        default=False, description="Whether duplicate keys are allowed"
    )
    min_pairs: int = Field(
        default=0, description="Minimum number of key-value pairs required"
    )
    max_pairs: Optional[int] = Field(
        default=None, description="Maximum number of key-value pairs allowed"
    )
    key_pattern: Optional[str] = Field(
        default=None, description="Regex pattern for key validation"
    )
    value_pattern: Optional[str] = Field(
        default=None, description="Regex pattern for value validation"
    )

    def get_type_name(self) -> str:
        return "key_value"

    def validate_value(self, value: Any) -> bool:
        """Validate if a value is acceptable for this handle type"""
        # Value should be a dictionary of key-value pairs
        if not isinstance(value, dict):
            return False

        # Check minimum and maximum pairs
        if len(value) < self.min_pairs:
            return False
        if self.max_pairs is not None and len(value) > self.max_pairs:
            return False

        # Check for duplicate keys if not allowed
        if not self.allow_duplicate_keys and len(value) != len(set(value.keys())):
            return False

        # Validate each key-value pair
        for key, val in value.items():
            # Check if key and value are strings
            if not isinstance(key, str) or not isinstance(val, str):
                return False

            # Check key pattern if provided
            if self.key_pattern and not self._matches_pattern(key, self.key_pattern):
                return False

            # Check value pattern if provided
            if self.value_pattern and not self._matches_pattern(
                val, self.value_pattern
            ):
                return False

        # Check if all required predefined items are present
        for item in self.predefined_items:
            if item.required and item.key not in value:
                return False

        return True

    def _matches_pattern(self, text: str, pattern: str) -> bool:
        """Check if text matches the given regex pattern"""
        import re

        try:
            return bool(re.match(pattern, text))
        except re.error:
            # Invalid regex pattern, consider it as a match
            return True

    def get_default_value(self) -> Dict[str, str]:
        """Return the default value for this handle type"""
        # Start with predefined items that have default values
        default_value = {}
        for item in self.predefined_items:
            if item.required or item.value:
                default_value[item.key] = item.value

        # If no predefined items and min_pairs > 0, add empty pairs
        if not default_value and self.min_pairs > 0:
            for i in range(self.min_pairs):
                default_value[f"key_{i + 1}"] = ""

        return default_value

    def to_json_schema(self) -> Dict[str, Any]:
        """Return JSON schema representation for frontend"""
        schema = {
            "type": "key_value",
            "key_label": self.key_label,
            "value_label": self.value_label,
            "fixed_items": [item.model_dump() for item in self.fixed_items],
            "predefined_items": [item.model_dump() for item in self.predefined_items],
            "allow_custom_keys": self.allow_custom_keys,
            "allow_duplicate_keys": self.allow_duplicate_keys,
            "min_pairs": self.min_pairs,
            "hide_input_field": self.hide_input_field,
        }

        if self.max_pairs is not None:
            schema["max_pairs"] = self.max_pairs
        if self.key_pattern:
            schema["key_pattern"] = self.key_pattern
        if self.value_pattern:
            schema["value_pattern"] = self.value_pattern

        return schema
