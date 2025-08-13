from typing import Any, Dict, List, Optional, Type, Union

from pydantic import BaseModel, field_validator
from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class DynamicTypeItem(BaseModel):
    type_label: str
    type_name: Union[str, Type]
    details: Any

    @field_validator("type_name", mode="before")
    @classmethod
    def validate_type_name(cls, v):
        if isinstance(v, type):
            return v.__name__
        return v


class DynamicTypeInputHandle(InputHandleTypeBase):
    """Handle for text field inputs"""

    type_options: Optional[List[DynamicTypeItem]]

    def get_type_name(self) -> str:
        return "dynamic"

    def validate_value(self, value: Any) -> bool:
        pass

    def get_default_value(self) -> str:
        pass

    def to_json_schema(self) -> Dict[str, Any]:
        pass
