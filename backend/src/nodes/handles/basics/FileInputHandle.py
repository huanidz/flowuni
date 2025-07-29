from typing import Any, Dict, List, Optional, Union

from pydantic import Field
from src.nodes.handles.HandleBase import HandleTypeBase


class FileInputHandle(HandleTypeBase):
    """Handle for file upload inputs"""

    accepted_types: List[str] = Field(
        default_factory=list
    )  # e.g., [".pdf", ".txt", "image/*"]
    multiple: bool = False
    max_size_mb: Optional[float] = None

    def get_type_name(self) -> str:
        return "file"

    def validate_value(self, value: Any) -> bool:
        # This would need to be implemented based on your file handling system
        # For now, just check if it's a string (file path) or file-like object
        if self.multiple:
            return isinstance(value, list)
        return isinstance(value, (str, dict))  # dict for file metadata

    def get_default_value(self) -> Union[str, List[str], None]:
        return [] if self.multiple else None

    def to_json_schema(self) -> Dict[str, Any]:
        return {
            "type": "file",
            "accepted_types": self.accepted_types,
            "multiple": self.multiple,
            "max_size_mb": self.max_size_mb,
        }
