from typing import List

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
            node_spec = nodeRegistry.get_node_spec_by_name(node.type)
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
