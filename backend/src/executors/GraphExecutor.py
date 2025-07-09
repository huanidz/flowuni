import networkx as nx
from typing import List

from src.schemas.flowbuilder.flow_graph_schemas import NodeData

from src.nodes.NodeBase import NodeSpec, NodeInput, NodeOutput

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
        logger.info("🚧 Starting graph preparation and execution plan traversal")

        for layer_idx, layer in enumerate(self.execution_plan):
            logger.info(f"\n📊 Executing Layer {layer_idx + 1} - Nodes: {layer}")

            for node_name in layer:
                logger.info(f"\n🔹 Processing Node: `{node_name}`")

                g_node = self.graph.nodes[node_name]
                node_spec: NodeSpec = g_node.get("spec", {})
                node_data: NodeData = g_node.get("data", {})

                logger.debug(f"📦 Node Spec: `{node_spec.name}`")
                logger.debug(f"🧩 Node Data:\n{node_data.model_dump_json(indent=2)}")

                try:
                    # Instantiate and run the node
                    node_instance = nodeRegistry.create_node_instance(node_spec.name)
                    output = node_instance.run(node_data)

                    logger.info(f"✅ Output from `{node_name}`: {output}")
                except Exception as e:
                    logger.error(f"❌ Error while executing node `{node_name}`: {e}")
                    continue

                # Process successors
                successors = list(self.graph.successors(node_name))
                logger.debug(f"➡️ Successors of `{node_name}`: {successors}")

                for successor_name in successors:
                    edge_data = self.graph.get_edge_data(node_name, successor_name)
                    source_handle = edge_data.get("source_handle").split("-index")[0]
                    target_handle = edge_data.get("target_handle").split("-index")[0]

                    logger.debug(
                        f"🔄 Propagating output:\n"
                        f"    🔸 Source Handle: `{source_handle}`\n"
                        f"    🔸 Target Node: `{successor_name}`\n"
                        f"    🔸 Target Handle: `{target_handle}`"
                    )

                    successor_node_data: NodeData = self.graph.nodes[successor_name].get("data", {})
                    successor_input_values = successor_node_data.input_values

                    try:
                        value_to_pass = output.model_dump()["input_values"][source_handle]
                        successor_input_values[target_handle] = value_to_pass

                        self.graph.nodes[successor_name]["data"] = successor_node_data

                        logger.info(
                            f"📤 Passed value from `{node_name}.{source_handle}` "
                            f"→ `{successor_name}.{target_handle}`: {value_to_pass}"
                        )
                    except Exception as e:
                        logger.warning(
                            f"⚠️ Failed to propagate value from `{source_handle}` "
                            f"to `{target_handle}` in `{successor_name}`: {e}"
                        )

        logger.info("✅ Graph preparation complete.\n")