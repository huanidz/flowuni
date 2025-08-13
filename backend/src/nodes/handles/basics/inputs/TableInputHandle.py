from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class TableColumnDType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"


class TableColumn(BaseModel):
    """Defines a column in the table"""

    name: str = Field(..., description="Column name/identifier")
    label: str = Field(..., description="Display label for the column")
    dtype: TableColumnDType = Field(..., description="Data type for the column")
    required: bool = Field(default=False, description="Whether this column is required")


class TableInputHandle(InputHandleTypeBase):
    """Table input handle that supports tool-enabled rows"""

    columns: List[TableColumn] = Field(..., description="Table column definitions")
    min_rows: int = Field(default=0, description="Minimum number of rows required")
    max_rows: Optional[int] = Field(
        default=None, description="Maximum number of rows allowed"
    )
    allow_dynamic_rows: bool = Field(
        default=True, description="Whether dynamic rows are allowed"
    )

    def get_type_name(self) -> str:
        return "table"

    def validate_value(self, value: Any) -> bool:
        """Validate if a value is acceptable for this handle type"""
        pass

    def get_default_value(self) -> Any:
        """Return the default value for this handle type"""
        pass

    def to_json_schema(self) -> Dict[str, Any]:
        """Return JSON schema representation for frontend"""
        pass
