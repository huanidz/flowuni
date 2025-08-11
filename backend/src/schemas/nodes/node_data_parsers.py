from typing import Any, Dict

from pydantic import BaseModel


class ToolDataParser(BaseModel):
    from_node_id: str
    input_values: Dict[str, Any]
    parameter_values: Dict[str, Any]
    tool_schema: Dict[str, Any]
