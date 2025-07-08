# src/engine/GraphCompiler.py

from typing import Dict, List, Any
import networkx as nx

from loguru import logger

class GraphCompiler:
    def __init__(self, graph: nx.DiGraph):
        self.graph = graph
        self.execution_plan: List[List[str]] = []

    def compile(self) -> List[List[str]]:
        if not nx.is_directed_acyclic_graph(self.graph):
            raise ValueError("The flow graph must be a directed acyclic graph (DAG).")

        # Topological layering using level-based sort
        in_degrees = dict(self.graph.in_degree())
        zero_indegree = [node for node, deg in in_degrees.items() if deg == 0]

        plan: List[List[str]] = []
        visited = set()

        while zero_indegree:
            current_layer = []
            next_zero_indegree = []

            for node_id in zero_indegree:
                if node_id in visited:
                    continue
                visited.add(node_id)
                current_layer.append(node_id)

                # Reduce in-degree for all successors
                for succ in self.graph.successors(node_id):
                    in_degrees[succ] -= 1
                    if in_degrees[succ] == 0:
                        next_zero_indegree.append(succ)

            if current_layer:
                plan.append(current_layer)
            zero_indegree = next_zero_indegree

        if len(visited) != len(self.graph.nodes):
            raise ValueError("Graph has cyclic dependencies or disconnected nodes.")

        self.execution_plan = plan
        return plan

    def debug_print_plan(self):
        print("Execution Plan:")
        for i, layer in enumerate(self.execution_plan):
            logger.debug(f"  Stage {i + 1}: {layer}")

    def get_node_spec(self, node_id: str) -> Dict[str, Any]:
        return self.graph.nodes[node_id].get("spec", {})

    def get_graph(self) -> nx.DiGraph:
        return self.graph
