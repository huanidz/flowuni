from typing import Any, Dict, List, Optional, Union

from pydantic import Field
from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class ImageInputInputHandle(InputHandleTypeBase):
    """Handle for image inputs"""

    accepted_formats: List[str] = Field(default_factory=list)
    multiple: bool = False
    max_size_mb: Optional[float] = None
    placeholder: Optional[str] = None

    def get_type_name(self) -> str:
        return "image"

    def validate_value(self, value: Any) -> bool:
        if self.multiple:
            return isinstance(value, list)
        # allow None (no file), string path, or dict metadata
        return isinstance(value, (str, dict)) or value is None

    def get_default_value(self) -> Union[str, List[str], None]:
        return [] if self.multiple else None

    def to_json_schema(self) -> Dict[str, Any]:
        schema: Dict[str, Any] = {
            "type": "image",
            "accepted_formats": self.accepted_formats,
            "multiple": self.multiple,
            "placeholder": self.placeholder,
        }
        if self.max_size_mb is not None:
            schema["max_size_mb"] = self.max_size_mb
        return schema
