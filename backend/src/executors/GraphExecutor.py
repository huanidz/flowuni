from typing import List, Optional

import networkx as nx
from loguru import logger
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class GraphExecutor:
    def __init__(self, graph: nx.DiGraph, execution_plan: List[List[str]]):
        self.graph: nx.DiGraph = graph
        self.execution_plan: List[List[str]] = execution_plan

        """
        Since there's many kind of nodes that not actually a processing-node \
        but that node is still connect to other processing-nodes
        For example, multiple ToolNode (non-proc) can be connected to \
        an AgentNode (proc) as the sub data. The preparation need to be done.
        """
        self.prepared_execution_plan: List[
            List[str]
        ] = []  # This is where the prepared execution plan will be stored after the prepare()

    def execute(self):
        logger.info(f"Starting graph execution with {len(self.execution_plan)} layers")

        nodeRegistry = NodeRegistry()

        for layer_index, layer in enumerate(self.execution_plan, 1):
            node_name = layer[0]

            try:
                with logger.contextualize(node=node_name):
                    # Get node configuration
                    g_node = self.graph.nodes[node_name]
                    node_spec: NodeSpec = g_node.get("spec", {})
                    node_data: NodeData = g_node.get("data", {})

                    # Create and execute node
                    node_instance: Optional[Node] = nodeRegistry.create_node_instance(
                        node_spec.name
                    )

                    if not node_instance:
                        logger.error(
                            f"Failed to create node instance: {node_spec.name}"
                        )
                        raise ValueError(
                            f"Node instance not found for name: {node_spec.name}"
                        )

                    logger.info(
                        f"Executing node [{layer_index}/{len(self.execution_plan)}]: {node_spec.name}"
                    )
                    current_node_executed_data: NodeData = node_instance.run(node_data)

                    # Process successors
                    successors = list(self.graph.successors(node_name))
                    if successors:
                        logger.debug(f"Updating {len(successors)} successor nodes")
                        self._update_successors(
                            node_name, successors, current_node_executed_data
                        )

            except Exception as e:
                logger.error(f"Failed to execute node {node_name}: {str(e)}")
                raise

        logger.success("Graph execution completed successfully")

    def _update_successors(
        self, node_name: str, successors: List[str], executed_data: NodeData
    ):
        """Update successor nodes with output data from current node"""
        for successor_name in successors:
            try:
                edge_data = self.graph.get_edge_data(node_name, successor_name)
                source_handle = edge_data.get("source_handle").split("-index")[0]
                target_handle = edge_data.get("target_handle").split("-index")[0]

                successor_node_data: NodeData = self.graph.nodes[successor_name].get(
                    "data", {}
                )

                # Update successor input with current node output
                successor_node_data.input_values[target_handle] = (
                    executed_data.output_values[source_handle]
                )

                self.graph.nodes[successor_name]["data"] = successor_node_data

            except Exception as e:
                logger.warning(f"Failed to update successor {successor_name}: {str(e)}")

    def prepare(self):
        pass
