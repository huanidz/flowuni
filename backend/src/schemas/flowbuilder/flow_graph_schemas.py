from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class PositionRequestData(BaseModel):
    """Represents the position coordinates of a node in the flow graph."""
    x: float
    y: float


class NodeDataRequestData(BaseModel):
    """Represents metadata and parameters associated with a node."""
    label: Optional[str] = None
    node_type: str  # corresponds to 'nodeType' in JSON
    parameters: Dict[str, Any]  # consider replacing with a typed model if possible

    class Config:
        allow_population_by_field_name = True
        fields = {
            'node_type': 'nodeType'
        }


class FlowNodeRequestData(BaseModel):
    """Represents a node in the flow graph with its ID, type, position, and data."""
    id: str
    type: str
    position: PositionRequestData
    data: NodeDataRequestData


class FlowEdgeRequestData(BaseModel):
    """Represents an edge between two nodes in the flow graph."""
    id: Optional[str] = None
    source: str
    target: str
    source_handle: Optional[str] = None  # corresponds to 'sourceHandle'
    target_handle: Optional[str] = None  # corresponds to 'targetHandle'

    class Config:
        allow_population_by_field_name = True
        fields = {
            'source_handle': 'sourceHandle',
            'target_handle': 'targetHandle'
        }


class FlowGraphRequest(BaseModel):
    """Top-level request model representing the entire flow graph."""
    nodes: List[FlowNodeRequestData]
    edges: List[FlowEdgeRequestData]