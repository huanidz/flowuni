from loguru import logger

import networkx as nx
from typing import Dict, List, Any

from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest, FlowNode
from src.nodes.NodeRegistry import nodeRegistry


class GraphLoader:
    @staticmethod
    def from_request(flow: FlowGraphRequest) -> nx.DiGraph:
        """
        Load a flow graph from FlowGraphRequest and return a NetworkX DiGraph.
        Each node is enriched with spec and runtime class (if available).
        """
        logger.debug("Loading flow graph from request")
        G = nx.DiGraph()

        # Load nodes
        list_of_nodes: List[FlowNode] = flow.nodes
        logger.debug(f"Found {len(list_of_nodes)} nodes in the flow request")

        for idx, node in enumerate(list_of_nodes):
            logger.debug(f"Processing node {idx + 1}/{len(list_of_nodes)} with ID: {node.id}, type: {node.type}")
            node_spec = nodeRegistry.get_node(node.type)
            if not node_spec:
                logger.debug(f"Unknown node type encountered: {node.type}")
                raise ValueError(f"Unknown node type: {node.type}")

            # Optionally: create node instance (runtime execution)
            NodeClass = nodeRegistry.create_node_class(node.type)
            node_instance = NodeClass() if NodeClass else None
            logger.debug(f"Instantiated node {node.id} with class: {NodeClass.__name__ if NodeClass else 'None'}")

            G.add_node(
                node.id,
                type=node.type,
                position=node.position,
                data=node.data,
                spec=node_spec,  # Pydantic NodeSpec
            )

        # Load edges
        logger.debug("Adding edges to the graph")
        for idx, edge in enumerate(flow.edges):
            logger.debug(f"Adding edge {idx + 1}/{len(flow.edges)}: {edge.source} -> {edge.target}")
            G.add_edge(edge.source, edge.target, source_handle=edge.sourceHandle, target_handle=edge.targetHandle)

        logger.debug("Flow graph successfully constructed")
        return G

    @staticmethod
    def to_serializable_dict(G: nx.DiGraph) -> Dict[str, Any]:
        """
        Convert the graph to a fully serializable dict (for API response or frontend).
        Removes any non-serializable Python objects (e.g., Node classes).
        """
        logger.debug("Converting graph to serializable dictionary")

        nodes = []
        for node_id, data in G.nodes(data=True):
            logger.trace(f"Serializing node: {node_id}")
            nodes.append({
                "id": node_id,
                "type": data["type"],
                "label": data.get("label"),
                "position": data.get("position"),
                "inputs": data.get("inputs"),
                "outputs": data.get("outputs"),
                "parameters": data.get("parameters"),
                "spec": data["spec"].model_dump() if hasattr(data["spec"], "model_dump") else None
            })

        edges = []
        for source, target, data in G.edges(data=True):
            logger.trace(f"Serializing edge: {source} -> {target}")
            edges.append({
                "source": source,
                "target": target,
                "sourceHandle": data.get("source_handle"),
                "targetHandle": data.get("target_handle")
            })

        logger.success("Graph successfully converted to serializable format")
        return {
            "nodes": nodes,
            "edges": edges
        }