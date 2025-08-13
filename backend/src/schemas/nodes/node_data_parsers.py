from typing import Any, Dict, Type

from pydantic import BaseModel


class BuildToolResult(BaseModel):
    tool_name: str
    tool_description: str
    tool_schema: Type[BaseModel]


class ToolDataParser(BaseModel):
    from_node_id: str
    input_values: Dict[str, Any]
    parameter_values: Dict[str, Any]
    tool_origin: str
    tool_name: str
    tool_description: str
    tool_schema: Dict[str, Any]
