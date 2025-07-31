from typing import Any, Dict

from pydantic import BaseModel


class ResolveRequest(BaseModel):
    node_name: str
    resolver: str
    input_values: Dict[str, Any]
    parameters: Dict[str, Any] = {}
