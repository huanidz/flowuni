import json
from typing import List

import networkx as nx
from loguru import logger
from src.consts.node_consts import (
    NODE_EXECUTION_STATUS,
    NODE_LABEL_CONSTS,
    NODE_TAGS_CONSTS,
    SPECIAL_NODE_INPUT_CONSTS,
)
from src.executors.MultiDiGraphUtils import MultiDiGraphUtils
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class GraphExecutionUtil:
    """
    Utility class for graph execution operations.

    This class contains static methods that can be used across different
    graph execution components to avoid code duplication and provide
    centralized functionality.
    """

    @staticmethod
    def validate_node_skip_status_before_execution(
        graph: nx.MultiDiGraph, node_id: str
    ) -> bool:
        """
        Validate if a node should be skipped based on its predecessors.

        Args:
            graph: The directed graph containing node specifications and data
            node_id: The node to validate

        Returns:
            bool: True if the node should be executed, False if it should be skipped
        """
        # Get all predecessors of this node
        predecessors = list(graph.predecessors(node_id))

        if not predecessors:
            # No predecessors, check the node's own status
            node_data = graph.nodes[node_id].get("data", NodeData())
            return node_data.execution_status != NODE_EXECUTION_STATUS.SKIPPED

        # Check if any predecessor is SKIPPED
        for pred_id in predecessors:
            pred_node = graph.nodes[pred_id]
            pred_data = pred_node.get("data", NodeData())

            if pred_data.execution_status == NODE_EXECUTION_STATUS.SKIPPED:
                # At least one predecessor is skipped, so this node should be skipped too
                logger.info(
                    f"Node {node_id} should be skipped due to skipped predecessor {pred_id}"
                )

                # Mark this node as SKIPPED
                current_node_data = graph.nodes[node_id].get("data", NodeData())
                current_node_data.execution_status = NODE_EXECUTION_STATUS.SKIPPED
                graph.nodes[node_id]["data"] = current_node_data

                return False

        # All predecessors are not skipped, check the node's own status
        node_data = graph.nodes[node_id].get("data", NodeData())
        return node_data.execution_status != NODE_EXECUTION_STATUS.SKIPPED

    @staticmethod
    def get_node_data_copy(graph: nx.MultiDiGraph, node_id: str) -> NodeData:
        """
        Get a deep copy of node data for thread safety.
        """
        try:
            g_node = graph.nodes[node_id]
            node_data = g_node.get("data", NodeData())

            # Return deep copy for thread safety
            import copy

            return copy.deepcopy(node_data)

        except Exception as e:
            logger.error(f"Failed to get data for node {node_id}: {str(e)}")
            return NodeData()

    @staticmethod
    def prepare_node_data_for_execution(
        graph: nx.MultiDiGraph, node_id: str, node_data: NodeData
    ) -> NodeData:
        """Prepare method for node_data before execution."""

        node_spec = graph.nodes[node_id].get("spec", None)
        node_tags = node_spec.tags if node_spec else []

        if NODE_TAGS_CONSTS.ROUTING in node_tags:
            # First, get the outgoing edges from this node
            # make a string that contain edge ids separated by comma. e.g. "edge_id_1,edge_id_2,edge_id_3"

            # Get all outgoing edges from this node
            outgoing_edges = MultiDiGraphUtils.iterate_edges_with_data(
                graph, node_id, data=True, keys=True
            )

            # Extract edge IDs and create comma-separated string
            edge_route_labels: List[str] = []
            for source, target, edge_key, edge_data in outgoing_edges:
                logger.info(f"👉 edge_data: {edge_data}")
                # edge ID is stored in the edge data
                edge_custom_data_field = edge_data.get("data", None)

                if not edge_custom_data_field:
                    logger.warning(
                        f"Edge from {source} to {target} with key {edge_key} is missing 'data' field."
                    )
                    continue

                edge_text_label = edge_custom_data_field.get("text", "")

                if edge_text_label:
                    edge_route_labels.append(edge_text_label)
                else:
                    logger.warning(
                        f"Edge from {source} to {target} with key {edge_key} has empty 'text' field."
                    )
                    continue

            if not edge_route_labels:
                logger.warning(f"No outgoing edges found for Routing Node {node_id}")
                return node_data

            # Unique the labels
            edge_route_labels = list(set(edge_route_labels))

            node_data.input_values[SPECIAL_NODE_INPUT_CONSTS.ROUTER_ROUTE_LABELS] = (
                json.dumps(edge_route_labels)
            )

            return node_data

        else:
            return node_data
