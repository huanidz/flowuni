from typing import Any, List, Optional

from pydantic import BaseModel, Field
from src.nodes.handles.OutputHandleBase import OutputHandleTypeBase


class RouterOutputData(BaseModel):
    route_value: Optional[Any] = Field(default=None)
    route_label_decisons: List[Any] = Field(default_factory=list)


class RouterOutputHandle(OutputHandleTypeBase):
    """Handle for general data outputs"""

    def get_type_name(self) -> str:
        return "router_output"
