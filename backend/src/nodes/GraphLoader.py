from typing import Any, Dict, List

import networkx as nx
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest, FlowNode


class GraphLoader:
    @staticmethod
    def from_request(flow: FlowGraphRequest) -> nx.DiGraph:
        """
        Load a flow graph from FlowGraphRequest and return a NetworkX DiGraph.
        Each node is enriched with spec and runtime class (if available).
        """
        G = nx.DiGraph()

        nodeRegistry = NodeRegistry()

        # Load nodes
        list_of_nodes: List[FlowNode] = flow.nodes

        for idx, node in enumerate(list_of_nodes):
            node_spec = nodeRegistry.get_node(node.type)
            if not node_spec:
                raise ValueError(f"Unknown node type: {node.type}")

            G.add_node(
                node.id,
                type=node.type,
                position=node.position,
                data=node.data,
                spec=node_spec,  # Pydantic NodeSpec
            )

        # Load edges
        for idx, edge in enumerate(flow.edges):
            G.add_edge(
                u_of_edge=edge.source,
                v_of_edge=edge.target,
                source_handle=edge.sourceHandle,
                target_handle=edge.targetHandle,
            )

        return G

    @staticmethod
    def to_serializable_dict(G: nx.DiGraph) -> Dict[str, Any]:
        """
        Convert the graph to a fully serializable dict (for API response or frontend).
        Removes any non-serializable Python objects (e.g., Node classes).
        """

        nodes = []
        for node_id, data in G.nodes(data=True):
            nodes.append(
                {
                    "id": node_id,
                    "type": data["type"],
                    "label": data.get("label"),
                    "position": data.get("position"),
                    "inputs": data.get("inputs"),
                    "outputs": data.get("outputs"),
                    "parameters": data.get("parameters"),
                    "spec": data["spec"].model_dump()
                    if hasattr(data["spec"], "model_dump")
                    else None,
                }
            )

        edges = []
        for source, target, data in G.edges(data=True):
            edges.append(
                {
                    "source": source,
                    "target": target,
                    "sourceHandle": data.get("source_handle"),
                    "targetHandle": data.get("target_handle"),
                }
            )

        return {"nodes": nodes, "edges": edges}
