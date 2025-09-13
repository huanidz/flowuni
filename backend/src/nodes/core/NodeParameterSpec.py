from typing import Literal

from src.nodes.core.NodeInput import NodeInput


class ParameterSpec(NodeInput):
    """Specification for a node parameter with type, default value, and description."""

    required: Literal[False] = False

    # Helper fields
    allow_incoming_edges: Literal[False] = False
    allow_multiple_incoming_edges: Literal[False] = False

    # Tool related
    enable_as_whole_for_tool: Literal[False] = False
