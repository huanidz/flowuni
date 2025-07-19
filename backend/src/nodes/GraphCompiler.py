# src/engine/GraphCompiler.py

from typing import Dict, List, Any, Optional
from collections import deque
import networkx as nx

from loguru import logger

class GraphCompilerError(Exception):
    """Custom exception for graph compilation errors."""
    pass


class GraphCompiler:
    """
    Compiles a directed acyclic graph (DAG) into an execution plan with topological layers.
    
    This compiler generates a layered execution plan where nodes in each layer can be
    executed in parallel, respecting the dependencies defined by the graph edges.
    """

    def __init__(self, graph: nx.DiGraph):
        """
        Initialize the GraphCompiler.
        
        Args:
            graph: A directed graph representing the execution flow
            
        Raises:
            GraphCompilerError: If the graph is not a DAG
        """
        if not isinstance(graph, nx.DiGraph):
            raise GraphCompilerError("Graph must be a NetworkX DiGraph")
        
        self._validate_graph(graph)
        self.graph = graph
        self._execution_plan: Optional[List[List[str]]] = None

    def _validate_graph(self, graph: nx.DiGraph) -> None:
        """
        Validate that the graph is a proper DAG.
        
        Args:
            graph: The graph to validate
            
        Raises:
            GraphCompilerError: If the graph is not a DAG
        """
        if not nx.is_directed_acyclic_graph(graph):
            raise GraphCompilerError("The flow graph must be a directed acyclic graph (DAG)")
        
        if len(graph.nodes) == 0:
            raise GraphCompilerError("Graph cannot be empty")

    def compile(self) -> List[List[str]]:
        """
        Compile the graph into a layered execution plan using Kahn's algorithm.
        
        Returns:
            A list of layers, where each layer contains node IDs that can be executed in parallel
            
        Raises:
            GraphCompilerError: If compilation fails due to graph structure issues
        """
        logger.info(f"Compiling graph with {len(self.graph.nodes)} nodes and {len(self.graph.edges)} edges")
        
        # Use Kahn's algorithm for topological sorting with layers
        execution_plan = self._kahn_topological_sort()
        
        # Validate the result
        self._validate_execution_plan(execution_plan)
        
        self._execution_plan = execution_plan
        logger.info(f"Compilation successful: {len(execution_plan)} execution layers")
        return execution_plan

    def _kahn_topological_sort(self) -> List[List[str]]:
        """
        Perform topological sorting using Kahn's algorithm with layering.
        
        Returns:
            List of execution layers
        """
        # Create a copy of in-degrees to avoid modifying the original graph
        in_degrees = dict(self.graph.in_degree())
        
        # Use deque for efficient queue operations
        current_layer_queue = deque([
            node for node, degree in in_degrees.items() if degree == 0
        ])
        
        execution_plan: List[List[str]] = []
        processed_nodes = set()
        
        while current_layer_queue:
            # Process all nodes in the current layer
            current_layer = list(current_layer_queue)
            current_layer_queue.clear()
            
            if not current_layer:
                break
                
            execution_plan.append(current_layer)
            
            # Process each node in the current layer
            for node_id in current_layer:
                processed_nodes.add(node_id)
                
                # Update in-degrees for successor nodes
                for successor in self.graph.successors(node_id):
                    in_degrees[successor] -= 1
                    if in_degrees[successor] == 0:
                        current_layer_queue.append(successor)
        
        # Check if all nodes were processed
        if len(processed_nodes) != len(self.graph.nodes):
            unprocessed = set(self.graph.nodes) - processed_nodes
            raise GraphCompilerError(
                f"Failed to process all nodes. Unprocessed nodes: {unprocessed}. "
                "This may indicate cycles or disconnected components."
            )
        
        return execution_plan

    def _validate_execution_plan(self, execution_plan: List[List[str]]) -> None:
        """
        Validate the generated execution plan.
        
        Args:
            execution_plan: The execution plan to validate
            
        Raises:
            GraphCompilerError: If the execution plan is invalid
        """
        if not execution_plan:
            raise GraphCompilerError("Execution plan cannot be empty")
        
        # Check that all nodes are included exactly once
        all_nodes_in_plan = set()
        for layer in execution_plan:
            if not layer:
                raise GraphCompilerError("Execution plan cannot contain empty layers")
            
            for node in layer:
                if node in all_nodes_in_plan:
                    raise GraphCompilerError(f"Node {node} appears multiple times in execution plan")
                all_nodes_in_plan.add(node)
        
        graph_nodes = set(self.graph.nodes)
        if all_nodes_in_plan != graph_nodes:
            missing = graph_nodes - all_nodes_in_plan
            extra = all_nodes_in_plan - graph_nodes
            raise GraphCompilerError(
                f"Execution plan mismatch. Missing nodes: {missing}, Extra nodes: {extra}"
            )

    @property
    def execution_plan(self) -> List[List[str]]:
        """
        Get the current execution plan.
        
        Returns:
            The execution plan, or empty list if not compiled yet
        """
        return self._execution_plan or []

    @property
    def is_compiled(self) -> bool:
        """Check if the graph has been compiled."""
        return self._execution_plan is not None

    def get_execution_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the execution plan.
        
        Returns:
            Dictionary containing execution statistics
        """
        if not self.is_compiled:
            return {"compiled": False}
        
        plan = self.execution_plan
        layer_sizes = [len(layer) for layer in plan]
        
        return {
            "compiled": True,
            "total_nodes": len(self.graph.nodes),
            "total_edges": len(self.graph.edges),
            "execution_layers": len(plan),
            "max_parallelism": max(layer_sizes) if layer_sizes else 0,
            "min_parallelism": min(layer_sizes) if layer_sizes else 0,
            "avg_parallelism": sum(layer_sizes) / len(layer_sizes) if layer_sizes else 0,
            "layer_sizes": layer_sizes,
        }

    def debug_print_plan(self) -> None:
        """Print the execution plan for debugging purposes."""
        if not self.is_compiled:
            logger.warning("Graph not compiled yet. Call compile() first.")
            return
        
        logger.info("Execution Plan:")
        for i, layer in enumerate(self.execution_plan):
            logger.info(f"  Layer {i + 1}: {layer} ({len(layer)} nodes)")
        
        stats = self.get_execution_stats()
        logger.info(f"  Total layers: {stats['execution_layers']}")
        logger.info(f"  Max parallelism: {stats['max_parallelism']}")

    def get_node_spec(self, node_id: str) -> Dict[str, Any]:
        """
        Get the specification for a specific node.
        
        Args:
            node_id: The ID of the node
            
        Returns:
            The node specification dictionary
            
        Raises:
            GraphCompilerError: If the node doesn't exist
        """
        if node_id not in self.graph.nodes:
            raise GraphCompilerError(f"Node '{node_id}' not found in graph")
        
        return self.graph.nodes[node_id].get("spec", {})

    def get_layer_for_node(self, node_id: str) -> Optional[int]:
        """
        Get the execution layer index for a specific node.
        
        Args:
            node_id: The ID of the node
            
        Returns:
            The layer index (0-based), or None if not found or not compiled
        """
        if not self.is_compiled:
            return None
        
        for layer_idx, layer in enumerate(self.execution_plan):
            if node_id in layer:
                return layer_idx
        
        return None

    def get_dependencies(self, node_id: str) -> List[str]:
        """
        Get the direct dependencies (predecessors) of a node.
        
        Args:
            node_id: The ID of the node
            
        Returns:
            List of node IDs that this node depends on
        """
        if node_id not in self.graph.nodes:
            raise GraphCompilerError(f"Node '{node_id}' not found in graph")
        
        return list(self.graph.predecessors(node_id))

    def get_dependents(self, node_id: str) -> List[str]:
        """
        Get the direct dependents (successors) of a node.
        
        Args:
            node_id: The ID of the node
            
        Returns:
            List of node IDs that depend on this node
        """
        if node_id not in self.graph.nodes:
            raise GraphCompilerError(f"Node '{node_id}' not found in graph")
        
        return list(self.graph.successors(node_id))

    @property
    def graph(self) -> nx.DiGraph:
        """Get the underlying graph (read-only access recommended)."""
        return self._graph

    @graph.setter
    def graph(self, value: nx.DiGraph) -> None:
        """Set the graph and reset compilation state."""
        self._graph = value
        self._execution_plan = None