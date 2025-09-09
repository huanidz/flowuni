from typing import Optional

from pydantic import BaseModel
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class NodeExecutionResult(BaseModel):
    """Container for node execution results."""

    node_id: str
    success: bool
    data: Optional[NodeData] = None
    error: Optional[str] = None
    execution_time: float = 0.0
