import networkx as nx
from typing import List

from src.schemas.flowbuilder.flow_graph_schemas import NodeData

from src.nodes.NodeBase import NodeSpec

from src.nodes.NodeRegistry import nodeRegistry

from loguru import logger

class GraphExecutor:

    def __init__(self, 
                 graph: nx.DiGraph, 
                 execution_plan: List[List[str]]):
        self.graph: nx.DiGraph = graph
        self.execution_plan: List[List[str]] = execution_plan

    def execute(self):
        pass
            
    def prepare(self):
        

        # Showing the execution plan
        logger.debug("Execution plan:")
        for layer in self.execution_plan:
            logger.debug(f"Executing layer: {layer}")

            node_name = layer[0]

            g_node = self.graph.nodes[node_name]

            node_spec: NodeSpec = g_node.get("spec", {})
            node_data: NodeData = g_node.get("data", {})

            logger.debug(f"Node data: {node_data.model_dump_json(indent=2)}")

            # Get the node instance
            node_instance = nodeRegistry.create_node_instance(node_spec.name)
            output = node_instance.run(node_data)
            logger.debug(f"🔴==>> output: {output}")

            successors = self.graph.successors(node_name)
            for successor_name in successors:
                logger.debug(f"🔴==>> successor_name: {successor_name}")

                edge_data = self.graph.get_edge_data(node_name, successor_name)
                logger.debug(f"🔴==>> edge_data: {edge_data}")

                source_handle = edge_data.get("source_handle").split("-index")[0]
                logger.debug(f"🔴==>> source_handle: {source_handle}")

                target_handle = edge_data.get("target_handle").split("-index")[0]
                logger.debug(f"🔴==>> target_handle: {target_handle}")

                # Update the NodeData of the successor node
                successor_node_data: NodeData = self.graph.nodes[successor_name].get("data", {})

                successor_input_values = successor_node_data.input_values
                successor_input_values[target_handle] = output.model_dump()["input_values"][source_handle]

                self.graph.nodes[successor_name]["data"] = successor_node_data