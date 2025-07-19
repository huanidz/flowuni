import networkx as nx
from typing import List
from src.schemas.flowbuilder.flow_graph_schemas import NodeData
from src.nodes.NodeBase import NodeSpec, Node
from src.nodes.NodeRegistry import nodeRegistry
from loguru import logger

from typing import Optional

class GraphExecutor:
    def __init__(self, 
                 graph: nx.DiGraph, 
                 execution_plan: List[List[str]]):
        self.graph: nx.DiGraph = graph
        self.execution_plan: List[List[str]] = execution_plan

        """
        Since there's many kind of nodes that not actually a processing-node but that node is still connect to other processing-nodes
        For example, multiple ToolNode (non-proc) can be connected to an AgentNode (proc) as the sub data. The preparation need to be done.
        """
        self.prepared_execution_plan: List[List[str]] = [] # This is where the prepared execution plan will be stored after the prepare()

    def execute(self):
        logger.info("Starting graph execution preparation")
        
        for layer_index, layer in enumerate(self.execution_plan, 1):
            logger.info(f"Processing execution layer {layer_index}/{len(self.execution_plan)}: {layer}")
            
            node_name = layer[0]
            with logger.contextualize(node=node_name):
                logger.debug("Retrieving node data and specifications")
                g_node = self.graph.nodes[node_name]
                node_spec: NodeSpec = g_node.get("spec", {})
                node_data: NodeData = g_node.get("data", {})
                
                logger.debug("Node configuration:")
                logger.debug(f"├── Specification: {node_spec}")
                logger.debug(f"└── Data: {node_data.model_dump_json(indent=2)}")

                logger.info(f"Creating and executing node instance: {node_spec.name}")
                node_instance: Optional[Node] = nodeRegistry.create_node_instance(node_spec.name)

                if not node_instance:
                    logger.error(f"Node instance not found for name: {node_spec.name}")
                    raise ValueError(f"Node instance not found for name: {node_spec.name}")

                current_node_executed_data: NodeData = node_instance.run(node_data)
                logger.success(f"Node execution complete. Output: {current_node_executed_data}")

                successors = list(self.graph.successors(node_name))
                if not successors:
                    logger.info("No successor nodes found")
                    continue

                logger.info(f"Processing {len(successors)} successor nodes")
                for successor_index, successor_name in enumerate(successors, 1):
                    with logger.contextualize(successor=successor_name):
                        logger.debug(f"Processing successor {successor_index}/{len(successors)}")
                        
                        edge_data = self.graph.get_edge_data(node_name, successor_name)
                        source_handle = edge_data.get("source_handle").split("-index")[0]
                        target_handle = edge_data.get("target_handle").split("-index")[0]
                        
                        logger.debug("Edge configuration:")
                        logger.debug(f"├── Edge data: {edge_data}")
                        logger.debug(f"├── Source handle: {source_handle}")
                        logger.debug(f"└── Target handle: {target_handle}")

                        successor_node_data: NodeData = self.graph.nodes[successor_name].get("data", {})
                        
                        # Log before update
                        logger.debug(f"Current successor input values: {successor_node_data.input_values}")
                        
                        # Update the values
                        successor_input_values = successor_node_data.input_values

                        successor_input_values[target_handle] = current_node_executed_data.output_values[source_handle]
                        
                        # Log after update
                        logger.debug(f"Updated successor input values: {successor_input_values}")
                        
                        self.graph.nodes[successor_name]["data"] = successor_node_data
                        logger.success(f"Successfully updated successor node data")

        logger.success("Graph preparation completed successfully")
            
    def prepare(self):
        pass