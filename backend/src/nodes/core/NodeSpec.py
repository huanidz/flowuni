from typing import Dict, List

from pydantic import BaseModel, Field
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.core.NodeParameterSpec import ParameterSpec


class NodeSpec(BaseModel):
    """Complete specification for a node including inputs, outputs, and parameters."""

    name: str = Field(..., description="Node name")
    description: str = Field(..., description="Node description")
    inputs: List[NodeInput] = Field(default_factory=list, description="Node inputs")
    outputs: List[NodeOutput] = Field(default_factory=list, description="Node outputs")
    parameters: Dict[str, ParameterSpec] = Field(
        default_factory=dict, description="Node parameters"
    )
    can_be_tool: bool = Field(
        default=False, description="Whether node can be used as a tool"
    )
