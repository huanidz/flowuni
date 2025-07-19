from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Position(BaseModel):
    """Represents the position coordinates of a node in the flow graph."""
    x: float
    y: float


class NodeData(BaseModel):
    """Represents metadata and parameters associated with a node."""
    label: Optional[str] = None
    node_type: str  # corresponds to 'node_type' in JSON
    input_values: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None  # consider replacing with a typed model if possible

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