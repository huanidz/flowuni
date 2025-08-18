from typing import Any, Dict, Optional, Type

from pydantic import BaseModel


class BuildToolResult(BaseModel):
    tool_name: str
    tool_description: str
    tool_schema: Optional[Type[BaseModel]] = None


class ToolDataParser(BaseModel):
    from_node_id: str
    input_values: Dict[str, Any]
    parameter_values: Dict[str, Any]
    tool_origin: str
    tool_name: str
    tool_description: str
    tool_schema: Optional[Dict[str, Any]] = None
