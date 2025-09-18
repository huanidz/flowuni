# src/engine/GraphCompiler.py

from collections import deque
from typing import Any, Dict, List, Optional

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
    """  # noqa

    def __init__(self, graph: nx.MultiDiGraph, remove_standalone: bool = False):
        """
        Initialize the GraphCompiler.

        Args:
            graph: A directed graph representing the execution flow
            remove_standalone: If True, remove nodes with no connections before compile.
                             If False, standalone nodes are placed in the first layer.

        Raises:
            GraphCompilerError: If the graph is not a DAG
        """
        if not isinstance(graph, nx.MultiDiGraph):
            raise GraphCompilerError("Graph must be a NetworkX MultiDiGraph")

        self.remove_standalone = remove_standalone
        self._original_graph = graph.copy()

        # Process the graph based on standalone node handling
        self.graph = self._process_graph(graph)

        self._validate_graph(self.graph)
        self._execution_plan: Optional[List[List[str]]] = None

    def _process_graph(self, graph: nx.MultiDiGraph) -> nx.MultiDiGraph:
        """
        Process the graph based on standalone node handling preference.

        Args:
            graph: The original graph

        Returns:
            Processed graph
        """
        if self.remove_standalone:
            # Remove standalone nodes (nodes with no edges)
            standalone_nodes = [node for node in graph.nodes if graph.degree(node) == 0]

            if standalone_nodes:
                logger.info(
                    f"Removing {len(standalone_nodes)} standalone nodes: {standalone_nodes}"  # noqa
                )
                processed_graph = graph.copy()
                processed_graph.remove_nodes_from(standalone_nodes)
                return processed_graph

        return graph.copy()

    def _validate_graph(self, graph: nx.MultiDiGraph) -> None:
        """
        Validate that the graph is a proper DAG.

        Args:
            graph: The graph to validate

        Raises:
            GraphCompilerError: If the graph is not a DAG
        """
        if len(graph.nodes) == 0:
            raise GraphCompilerError("Graph cannot be empty after processing")

        if not nx.is_directed_acyclic_graph(graph):
            raise GraphCompilerError(
                "The flow graph must be a directed acyclic graph (DAG)"
            )

    def compile(self) -> List[List[str]]:
        """
        Compile the graph into a layered execution plan using Kahn's algorithm.

        Returns:
            A list of layers, where each layer contains node IDs that can be executed in parallel

        Raises:
            GraphCompilerError: If compilation fails due to graph structure issues
        """  # noqa
        logger.info(
            f"Compiling graph with {len(self.graph.nodes)} nodes and {len(self.graph.edges)} edges"  # noqa
        )

        # Handle standalone nodes if not removing them
        standalone_nodes = []
        if not self.remove_standalone:
            standalone_nodes = [
                node for node in self.graph.nodes if self.graph.degree(node) == 0
            ]

        # Use Kahn's algorithm for topological sorting with layers
        execution_plan = self._kahn_topological_sort()

        # If we have standalone nodes and aren't removing them, add them to the first layer # noqa
        if standalone_nodes:
            if execution_plan:
                # Add standalone nodes to the first layer
                execution_plan[0] = standalone_nodes + execution_plan[0]
            else:
                # If no other nodes, create a layer with just standalone nodes
                execution_plan = [standalone_nodes]

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
        # Filter out standalone nodes for the algorithm if we're keeping them
        nodes_to_process = [
            node
            for node in self.graph.nodes
            if not (not self.remove_standalone and self.graph.degree(node) == 0)
        ]

        if not nodes_to_process:
            return []

        # Create a subgraph without standalone nodes for processing
        processing_graph = self.graph.subgraph(nodes_to_process).copy()

        # Create a copy of in-degrees for the processing graph
        in_degrees = dict(processing_graph.in_degree())

        # Use deque for efficient queue operations
        current_layer_queue = deque(
            [node for node, degree in in_degrees.items() if degree == 0]
        )

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
                for successor in processing_graph.successors(node_id):
                    in_degrees[successor] -= 1
                    if in_degrees[successor] == 0:
                        current_layer_queue.append(successor)

        # Check if all nodes were processed
        if len(processed_nodes) != len(processing_graph.nodes):
            unprocessed = set(processing_graph.nodes) - processed_nodes
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
                    raise GraphCompilerError(
                        f"Node {node} appears multiple times in execution plan"
                    )
                all_nodes_in_plan.add(node)

        graph_nodes = set(self.graph.nodes)
        if all_nodes_in_plan != graph_nodes:
            missing = graph_nodes - all_nodes_in_plan
            extra = all_nodes_in_plan - graph_nodes
            raise GraphCompilerError(
                f"Execution plan mismatch. Missing nodes: {missing}, Extra nodes: {extra}"  # noqa
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
            "avg_parallelism": sum(layer_sizes) / len(layer_sizes)
            if layer_sizes
            else 0,
            "layer_sizes": layer_sizes,
            "remove_standalone": self.remove_standalone,
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
        logger.info(f"  Remove standalone: {stats['remove_standalone']}")

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
    def graph(self) -> nx.MultiDiGraph:
        """Get the underlying processed graph (read-only access recommended)."""
        return self._graph

    @graph.setter
    def graph(self, value: nx.MultiDiGraph) -> None:
        """Set the graph and reset compilation state."""
        self._graph = value
        self._execution_plan = None
