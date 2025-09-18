from typing import List

import networkx as nx
from loguru import logger
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_crud_schemas import FlowCreateRequest
from src.schemas.flowbuilder.flow_graph_schemas import CanvasFlowRunRequest, FlowNode


class GraphLoader:
    @staticmethod
    def from_request(flow: CanvasFlowRunRequest) -> nx.DiGraph:
        """
        Load a flow graph from CanvasFlowRunRequest and return a NetworkX DiGraph.
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
            logger.debug(f"Loading edge {idx}: {edge}")

            G.add_edge(
                id=edge.id,
                u_of_edge=edge.source,
                v_of_edge=edge.target,
                source_handle=edge.sourceHandle,
                target_handle=edge.targetHandle,
                type=edge.type,
                data=edge.data,
            )

        # Get all edges
        all_edges = G.edges(data=True)
        logger.debug(f"All edges in the graph: {all_edges}")

        return G

    @staticmethod
    def from_flow_create_request(flow: FlowCreateRequest) -> nx.DiGraph:
        """
        Load a flow graph from FlowCreateRequest and return a NetworkX DiGraph.
        Each node is enriched with spec and runtime class (if available).

        This function is used to perform validate if the flow definition is valid when creating a flow.

        Its considered ok if the GraphLoader can load ok.
        """
        try:
            if not flow.flow_definition:
                raise ValueError("Flow definition is empty")

            # If not contains nodes or edges, raise error
            if (
                "nodes" not in flow.flow_definition
                or "edges" not in flow.flow_definition
            ):
                raise ValueError("Flow definition must contain nodes and edges")

            list_of_nodes = flow.flow_definition.get("nodes", [])
            list_of_edges = flow.flow_definition.get("edges", [])

            canvas_flow = CanvasFlowRunRequest.model_validate(
                {"nodes": list_of_nodes, "edges": list_of_edges}
            )

            return GraphLoader.from_request(canvas_flow)
        except Exception as e:
            logger.error(f"Error loading flow graph: {e}")
            raise ValueError(f"Invalid flow definition: {e}") from e
