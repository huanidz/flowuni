import asyncio
import copy
import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import networkx as nx
from loguru import logger
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class GraphExecutorError(Exception):
    """Custom exception for graph execution errors."""

    pass


class NodeExecutionResult:
    """Container for node execution results."""

    def __init__(
        self,
        node_id: str,
        success: bool,
        data: Optional[NodeData] = None,
        error: Optional[Exception] = None,
        execution_time: float = 0.0,
    ):
        self.node_id = node_id
        self.success = success
        self.data = data
        self.error = error
        self.execution_time = execution_time


class GraphExecutor:
    """
    Executes a compiled graph with parallel execution within layers.

    This executor processes nodes layer by layer, where all nodes in each layer
    are executed concurrently before proceeding to the next layer.
    """

    def __init__(
        self,
        graph: nx.DiGraph,
        execution_plan: List[List[str]],
        max_workers: Optional[int] = None,
    ):
        """
        Initialize the GraphExecutor.

        Args:
            graph: The directed graph containing node specifications and data
            execution_plan: List of layers, where each layer contains nodes that can execute in parallel
            max_workers: Maximum number of threads for parallel execution (defaults to min(32, (cpu_count or 1) + 4))
        """
        self.graph: nx.DiGraph = graph
        self.execution_plan: List[List[str]] = execution_plan
        self.max_workers = max_workers

        # Thread safety
        self._update_lock = threading.Lock()
        self._node_registry = NodeRegistry()

        # Execution state
        self._is_executing = False
        self._cancelled = False

        # Statistics
        self._execution_stats = {
            "total_nodes": sum(len(layer) for layer in execution_plan),
            "total_layers": len(execution_plan),
            "completed_nodes": 0,
            "failed_nodes": 0,
            "start_time": None,
            "end_time": None,
        }

        logger.info(
            f"Initialized GraphExecutor with {self._execution_stats['total_nodes']} nodes "
            f"across {self._execution_stats['total_layers']} layers"
        )

    async def execute(self) -> Dict[str, Any]:
        """
        Execute the graph asynchronously with parallel processing within layers.

        Returns:
            Dictionary containing execution statistics and results

        Raises:
            GraphExecutorError: If execution fails
        """
        if self._is_executing:
            raise GraphExecutorError("Executor is already running")

        self._is_executing = True
        self._cancelled = False
        self._execution_stats["start_time"] = time.time()

        try:
            logger.info(
                f"Starting parallel graph execution with {len(self.execution_plan)} layers"
            )

            async with self._create_thread_pool() as executor:
                for layer_index, layer_nodes in enumerate(self.execution_plan, 1):
                    if self._cancelled:
                        raise GraphExecutorError("Execution was cancelled")

                    logger.info(
                        f"Executing layer {layer_index}/{len(self.execution_plan)} with {len(layer_nodes)} nodes: {layer_nodes}"
                    )

                    layer_start_time = time.time()

                    # Execute all nodes in this layer concurrently
                    layer_results = await self._execute_layer(
                        executor, layer_nodes, layer_index
                    )

                    layer_execution_time = time.time() - layer_start_time

                    # Process results and update statistics
                    successful_results = []
                    failed_results = []

                    for result in layer_results:
                        if result.success:
                            successful_results.append(result)
                            self._execution_stats["completed_nodes"] += 1
                        else:
                            failed_results.append(result)
                            self._execution_stats["failed_nodes"] += 1

                    if failed_results:
                        error_msg = f"Layer {layer_index} execution failed. Failed nodes: {[r.node_id for r in failed_results]}"
                        logger.error(error_msg)

                        # Log individual node errors
                        for result in failed_results:
                            logger.error(
                                f"Node {result.node_id} failed: {result.error}"
                            )

                        raise GraphExecutorError(error_msg)

                    logger.success(
                        f"Layer {layer_index} completed successfully in {layer_execution_time:.3f}s. "
                        f"Processed {len(successful_results)} nodes."
                    )

                    # Update successor nodes with results
                    await self._update_all_successors(successful_results)

            self._execution_stats["end_time"] = time.time()
            total_time = (
                self._execution_stats["end_time"] - self._execution_stats["start_time"]
            )

            logger.success(
                f"Graph execution completed successfully in {total_time:.3f}s. "
                f"Processed {self._execution_stats['completed_nodes']} nodes across "
                f"{self._execution_stats['total_layers']} layers."
            )

            return self._get_execution_summary()

        except Exception as e:
            self._execution_stats["end_time"] = time.time()
            logger.error(f"Graph execution failed: {str(e)}")
            raise GraphExecutorError(f"Execution failed: {str(e)}") from e
        finally:
            self._is_executing = False

    @asynccontextmanager
    async def _create_thread_pool(self):
        """Create and manage thread pool lifecycle."""
        executor = ThreadPoolExecutor(max_workers=self.max_workers)
        try:
            logger.debug(
                f"Created thread pool with max_workers={executor._max_workers}"
            )
            yield executor
        finally:
            logger.debug("Shutting down thread pool")
            executor.shutdown(wait=True)

    async def _execute_layer(
        self, executor: ThreadPoolExecutor, layer_nodes: List[str], layer_index: int
    ) -> List[NodeExecutionResult]:
        """
        Execute all nodes in a layer concurrently.

        Args:
            executor: Thread pool executor
            layer_nodes: List of node IDs to execute
            layer_index: Current layer index for logging

        Returns:
            List of execution results for all nodes in the layer
        """
        if not layer_nodes:
            logger.warning(f"Layer {layer_index} is empty")
            return []

        # Submit all node executions to the thread pool
        loop = asyncio.get_event_loop()
        futures: Dict[Future, str] = {}

        for node_id in layer_nodes:
            try:
                # Prepare node data with deep copy for thread safety
                prepared_data = self._prepare_node_data(node_id)

                # Submit node execution to thread pool
                future = executor.submit(
                    self._execute_single_node, node_id, prepared_data, layer_index
                )
                futures[future] = node_id

                logger.debug(
                    f"Submitted node {node_id} for execution in layer {layer_index}"
                )

            except Exception as e:
                logger.error(f"Failed to submit node {node_id} for execution: {str(e)}")
                # Return failed result immediately
                return [NodeExecutionResult(node_id, False, error=e)]

        # Wait for all futures to complete
        results = []
        completed_count = 0

        try:
            # Use as_completed to get results as they finish
            for future in as_completed(futures.keys()):
                node_id = futures[future]
                completed_count += 1

                try:
                    result = future.result()
                    results.append(result)

                    if result.success:
                        logger.debug(
                            f"Node {node_id} completed successfully ({completed_count}/{len(layer_nodes)}) "
                            f"in {result.execution_time:.3f}s"
                        )
                    else:
                        logger.error(f"Node {node_id} execution failed: {result.error}")

                except Exception as e:
                    logger.error(f"Failed to get result for node {node_id}: {str(e)}")
                    results.append(NodeExecutionResult(node_id, False, error=e))

        except Exception as e:
            logger.error(f"Error waiting for layer {layer_index} completion: {str(e)}")
            # Cancel remaining futures
            for future in futures.keys():
                future.cancel()
            raise

        return results

    def _execute_single_node(
        self, node_id: str, node_data: NodeData, layer_index: int
    ) -> NodeExecutionResult:
        """
        Execute a single node in a thread.

        Args:
            node_id: ID of the node to execute
            node_data: Node data for execution
            layer_index: Current layer index

        Returns:
            NodeExecutionResult containing execution outcome
        """
        start_time = time.time()

        try:
            with logger.contextualize(node=node_id, layer=layer_index):
                logger.debug(f"Starting execution of node {node_id}")

                # Get node specification
                graph_node = self.graph.nodes[node_id]
                node_spec: NodeSpec = graph_node.get("spec")

                if not node_spec:
                    raise GraphExecutorError(f"Node {node_id} missing specification")

                logger.debug(f"Node {node_id} spec: {node_spec.name}")

                # Create node instance
                node_instance: Optional[Node] = (
                    self._node_registry.create_node_instance(node_spec.name)
                )

                if not node_instance:
                    raise GraphExecutorError(
                        f"Failed to create node instance for: {node_spec.name}"
                    )

                # Execute the node
                logger.info(f"Executing node {node_id} ({node_spec.name})")

                try:
                    executed_data: NodeData = node_instance.run(node_data)
                    execution_time = time.time() - start_time

                    logger.info(
                        f"Node {node_id} executed successfully in {execution_time:.3f}s. "
                        f"Output keys: {list(executed_data.output_values.keys()) if executed_data.output_values else 'None'}"
                    )

                    return NodeExecutionResult(
                        node_id, True, executed_data, execution_time=execution_time
                    )

                except Exception as node_error:
                    execution_time = time.time() - start_time
                    logger.error(
                        f"Node {node_id} execution failed after {execution_time:.3f}s: {str(node_error)}"
                    )
                    return NodeExecutionResult(
                        node_id, False, error=node_error, execution_time=execution_time
                    )

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Critical error executing node {node_id}: {str(e)}")
            return NodeExecutionResult(
                node_id, False, error=e, execution_time=execution_time
            )

    def _prepare_node_data(self, node_id: str) -> NodeData:
        """
        Prepare node data for execution with deep copy for thread safety.

        Args:
            node_id: ID of the node

        Returns:
            Deep copy of node data

        Raises:
            GraphExecutorError: If node data is invalid
        """
        try:
            if node_id not in self.graph.nodes:
                raise GraphExecutorError(f"Node {node_id} not found in graph")

            graph_node = self.graph.nodes[node_id]
            node_data = graph_node.get("data")

            if node_data is None:
                logger.warning(f"Node {node_id} has no data, creating empty NodeData")
                return NodeData()

            # Deep copy to prevent race conditions
            copied_data = copy.deepcopy(node_data)
            logger.debug(
                f"Prepared data for node {node_id} with input keys: {list(copied_data.input_values.keys()) if copied_data.input_values else 'None'}"
            )

            return copied_data

        except Exception as e:
            raise GraphExecutorError(
                f"Failed to prepare data for node {node_id}: {str(e)}"
            ) from e

    async def _update_all_successors(
        self, successful_results: List[NodeExecutionResult]
    ):
        """
        Update all successor nodes with execution results in a thread-safe manner.

        Args:
            successful_results: List of successful node execution results
        """
        update_count = 0

        for result in successful_results:
            try:
                successors = list(self.graph.successors(result.node_id))
                if successors:
                    logger.debug(
                        f"Updating {len(successors)} successors for node {result.node_id}"
                    )
                    self._update_successors_thread_safe(
                        result.node_id, successors, result.data
                    )
                    update_count += len(successors)

            except Exception as e:
                logger.error(
                    f"Failed to update successors for node {result.node_id}: {str(e)}"
                )
                # Continue with other nodes rather than failing completely

        if update_count > 0:
            logger.debug(f"Updated {update_count} successor node inputs")

    def _update_successors_thread_safe(
        self, node_id: str, successors: List[str], executed_data: NodeData
    ):
        """
        Update successor nodes with output data in a thread-safe manner.

        Args:
            node_id: ID of the source node
            successors: List of successor node IDs
            executed_data: Execution result data from source node
        """
        if not executed_data or not executed_data.output_values:
            logger.warning(f"Node {node_id} has no output data to propagate")
            return

        with self._update_lock:
            for successor_id in successors:
                try:
                    # Get edge data
                    edge_data = self.graph.get_edge_data(node_id, successor_id)
                    if not edge_data:
                        logger.warning(
                            f"No edge data found between {node_id} and {successor_id}"
                        )
                        continue

                    source_handle = edge_data.get("source_handle", "")
                    target_handle = edge_data.get("target_handle", "")

                    # Handle splitting logic with validation
                    if source_handle and "-index" in source_handle:
                        source_handle = source_handle.split("-index")[0]
                    if target_handle and "-index" in target_handle:
                        target_handle = target_handle.split("-index")[0]

                    if not source_handle or not target_handle:
                        logger.warning(
                            f"Invalid handles between {node_id} and {successor_id}: source='{source_handle}', target='{target_handle}'"
                        )
                        continue

                    # Get source output value
                    if source_handle not in executed_data.output_values:
                        logger.warning(
                            f"Source handle '{source_handle}' not found in {node_id} outputs: {list(executed_data.output_values.keys())}"
                        )
                        continue

                    output_value = executed_data.output_values[source_handle]

                    # Update successor node data
                    successor_node = self.graph.nodes[successor_id]
                    successor_data: NodeData = successor_node.get("data")

                    if successor_data is None:
                        successor_data = NodeData()
                        self.graph.nodes[successor_id]["data"] = successor_data

                    # Ensure input_values dict exists
                    if successor_data.input_values is None:
                        successor_data.input_values = {}

                    # Update the target input
                    successor_data.input_values[target_handle] = copy.deepcopy(
                        output_value
                    )

                    logger.debug(
                        f"Updated {successor_id}.{target_handle} with data from {node_id}.{source_handle}"
                    )

                except Exception as e:
                    logger.error(
                        f"Failed to update successor {successor_id} from {node_id}: {str(e)}"
                    )
                    # Continue with other successors

    def cancel_execution(self):
        """Cancel the current execution."""
        self._cancelled = True
        logger.warning("Execution cancellation requested")

    def _get_execution_summary(self) -> Dict[str, Any]:
        """Get comprehensive execution statistics."""
        total_time = (self._execution_stats["end_time"] or time.time()) - (
            self._execution_stats["start_time"] or time.time()
        )

        return {
            "success": True,
            "total_nodes": self._execution_stats["total_nodes"],
            "completed_nodes": self._execution_stats["completed_nodes"],
            "failed_nodes": self._execution_stats["failed_nodes"],
            "total_layers": self._execution_stats["total_layers"],
            "execution_time": total_time,
            "nodes_per_second": self._execution_stats["completed_nodes"] / total_time
            if total_time > 0
            else 0,
            "start_time": self._execution_stats["start_time"],
            "end_time": self._execution_stats["end_time"],
        }

    @property
    def is_executing(self) -> bool:
        """Check if executor is currently running."""
        return self._is_executing

    @property
    def execution_stats(self) -> Dict[str, Any]:
        """Get current execution statistics."""
        return self._execution_stats.copy()

    def prepare(self):
        """Prepare method for backward compatibility - currently no-op."""
        logger.debug(
            "Prepare method called - no preparation needed for parallel executor"
        )
        pass
