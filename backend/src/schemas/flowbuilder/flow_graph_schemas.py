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

    # Execution information
    execution_result: Optional[str] = None
    execution_status: Optional[
        Literal["draft", "queued", "running", "completed", "failed", "skipped"]
    ] = None


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
    type: Optional[str] = None  # Edge type for custom rendering
    data: Optional[Dict[str, Any]] = None


class CanvasFlowRunRequest(BaseModel):
    """Top-level request model representing the entire flow graph."""

    nodes: List[FlowNode]
    edges: List[FlowEdge]

    # Execution controls
    start_node: Optional[str] = Field(
        default=None,
        description="The ID of the node to start the flow from. "
        "If None, the flow will start from the first node.",
    )
    scope: Literal["node_only", "downstream"] = Field(
        default="downstream",
        description="The scope of the flow graph execution. "
        "If 'node_only', the flow will execute only the selected node. "
        "If 'downstream', the flow will execute the selected node and its downstream nodes.",  # noqa: E501
    )

    session_id: Optional[str] = Field(
        default=None,
        description="The session ID for the flow run. If None, a new session will be created.",  # noqa: E501
    )


# --- Flow Run API ---


class ApiFlowRunMessage(BaseModel):
    type: str
    content: str


class ApiFlowRunRequest(BaseModel):
    messages: Optional[List[ApiFlowRunMessage]] = Field(
        default_factory=list,
        description="List of messages to be sent to the flow run.",
    )
    session_id: Optional[str] = None
