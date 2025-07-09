import networkx as nx
from typing import List

from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest, NodeData

from src.nodes.NodeBase import NodeSpec, NodeInput, NodeOutput

from loguru import logger

class GraphExecutor:

    def __init__(self, 
                 graph: nx.DiGraph, 
                 execution_plan: List[List[str]]):
        self.graph: nx.DiGraph = graph
        self.execution_plan: List[List[str]] = execution_plan

    def execute(self):

        # Loop through nodes
        for node, attrs in self.graph.nodes(data=True):

            print("=== NODE ===")

            print("Node:", node)

            node_data: NodeData = attrs["data"]
            print("Node data:", node_data.model_dump_json(indent=2))

            node_spec: NodeSpec = attrs["spec"]
            print("Node spec:", node_spec.model_dump())

            node_inputs: List[NodeInput] = node_spec.inputs
            print("Node inputs:", node_inputs)

            node_outputs: List[NodeOutput] = node_spec.outputs
            print("Node outputs:", node_outputs)

            break

        # logger.debug("Executing flow graph")
        # for layer in self.execution_plan:
        #     logger.debug(f"Executing layer: {layer}")
            
    def prepare(self):
        pass