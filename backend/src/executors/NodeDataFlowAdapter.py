from typing import Any, Callable, Dict, Tuple

from src.nodes.handles.basics.inputs import InputHandleTypeEnum
from src.nodes.handles.basics.outputs import OutputHandleTypeEnum
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class AdapterMatrix:
    """Matrix-based adapter for node data transformation."""

    def __init__(self):
        self.adaption_matrix = {}

    def _build_adaption_matrix(self) -> Dict[Tuple[str, str], Callable]:
        MATRIX = {
            (InputHandleTypeEnum.TEXT_FIELD, OutputHandleTypeEnum.TEXT): lambda x: x
        }
        return MATRIX

    # def


class NodeDataFlowAdapter:
    @staticmethod
    def adapt(
        source_node_data: NodeData,
        source_handle_type_detail: Dict[str, Any],
        target_handle_type_detail: Dict[str, Any],
    ) -> NodeData:
        """Adapt source node data to target node data."""
        return source_node_data
