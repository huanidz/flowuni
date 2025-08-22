from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class Position(BaseModel):
    """Represents the position coordinates of a node in the flow graph."""

    x: float
    y: float


class ToolConfig(BaseModel):
    tool_name: Optional[str] = None
    tool_description: Optional[str] = None


class NodeData(BaseModel):
    """Represents metadata and parameters associated with a node."""

    label: Optional[str] = None
    node_type: Optional[str] = None  # corresponds to 'node_type' in JSON
    input_values: Optional[Dict[str, Any]] = None
    output_values: Optional[Dict[str, Any]] = None
    parameter_values: Optional[Dict[str, Any]] = (
        None  # consider replacing with a typed model if possible
    )
    mode: Optional[Literal["NormalMode", "ToolMode"]] = None
    tool_configs: Optional[ToolConfig] = None


class FlowNode(BaseModel):
    """Represents a node in the flow graph with its ID, type, position, and data."""

    id: str
    type: str
    position: Position
    data: NodeData


class FlowEdge(BaseModel):
    """Represents an edge between two nodes in the flow graph."""

    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None  # corresponds to 'sourceHandle'
    targetHandle: Optional[str] = None  # corresponds to 'targetHandle'


class FlowGraphRequest(BaseModel):
    """Top-level request model representing the entire flow graph."""

    nodes: List[FlowNode]
    edges: List[FlowEdge]


class FlowPlaygroundRequest(BaseModel):
    flow_id: str
    flow_graph_request: FlowGraphRequest


# --- Flow Run API ---


class FlowRunMessage(BaseModel):
    type: str
    content: str


class FlowRunRequest(BaseModel):
    messages: List[FlowRunMessage] = Field(
        default_factory=list,
        description="List of messages to be sent to the flow run.",
    )
    session_id: Optional[str] = None
