from typing import Any, Dict

from src.schemas.flowbuilder.flow_graph_schemas import NodeData

DATA_FLOW_ADAPTER_REGISTRY = {}


class NodeDataFlowAdapter:
    @staticmethod
    def adapt(
        source_node_data: NodeData,
        source_handle_type_detail: Dict[str, Any],
        target_handle_type_detail: Dict[str, Any],
    ) -> NodeData:
        """Adapt source node data to target node data."""
        return source_node_data
