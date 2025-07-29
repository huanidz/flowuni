import copy
import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional

import networkx as nx
from loguru import logger
from pydantic import BaseModel
from src.executors.ExecutionContext import ExecutionContext
from src.executors.NodeExecution import NodeExecutionEvent
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class GraphExecutorError(Exception):
    """Custom exception for graph execution errors."""

    pass


class NodeExecutionResult(BaseModel):
    """Container for node execution results."""

    node_id: str
    success: bool
    data: Optional[NodeData] = None
    error: Optional[str] = None
    execution_time: float = 0.0


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
        enable_debug: bool = True,
        execution_context: Optional[ExecutionContext] = None,
    ):
        """
        Initialize the GraphExecutor.

        Args:
            graph: The directed graph containing node specifications and data
            execution_plan: List of layers, where each layer contains nodes that can execute in parallel
            max_workers: Maximum number of threads for parallel execution
        """  # noqa: E501
        self.graph: nx.DiGraph = graph
        self.execution_plan: List[List[str]] = execution_plan
        self.max_workers = max_workers

        # Flag and class for execution context
        self.enable_debug = enable_debug
        self.execution_context = execution_context

        # Thread safety for updating graph
        self._update_lock = threading.Lock()

        # Create node registry instance
        self._node_registry = NodeRegistry()

        # logger.info(
        #     f"Initialized GraphExecutor with {sum(len(layer) for layer in execution_plan)} nodes "  # noqa: E501
        #     f"across {len(execution_plan)} layers"
        # )

    def push_event(self, node_id: str, event: str, data: Any = {}):
        # Publish node event to Redis
        if self.execution_context and self.enable_debug:
            self.execution_context.publish_node_event(
                node_id=node_id, event=event, data=data
            )

    def end_event(self):
        # Publish DONE event to Redis
        if self.execution_context and self.enable_debug:
            self.execution_context.end()

    def execute(self) -> Dict[str, Any]:
        """
        Execute the graph with parallel processing within layers.

        This is the synchronous version that matches your old working code structure.
        """
        # logger.info(f"Starting graph execution with {len(self.execution_plan)} layers")

        start_time = time.time()
        total_nodes = sum(len(layer) for layer in self.execution_plan)
        completed_nodes = 0

        try:
            # Use ThreadPoolExecutor for parallel execution within layers
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                for layer_index, layer_nodes in enumerate(self.execution_plan, 1):
                    # logger.info(
                    #     f"Executing layer {layer_index}/{len(self.execution_plan)} "
                    #     f"with {len(layer_nodes)} nodes: {layer_nodes}"
                    # )

                    layer_start_time = time.time()

                    # Execute all nodes in this layer in parallel
                    layer_results = self._execute_layer_parallel(
                        executor, layer_nodes, layer_index
                    )

                    layer_execution_time = time.time() - layer_start_time

                    # Check for failures
                    failed_nodes = [r for r in layer_results if not r.success]
                    successful_nodes = [r for r in layer_results if r.success]

                    if failed_nodes:
                        error_msg = f"Layer {layer_index} execution failed. Failed nodes: {[r.node_id for r in failed_nodes]}"  # noqa: E501
                        logger.error(error_msg)

                        for result in failed_nodes:
                            logger.error(
                                f"Node {result.node_id} failed: {result.error}"
                            )

                        raise GraphExecutorError(error_msg)

                    logger.success(
                        f"Layer {layer_index} completed successfully in {layer_execution_time:.3f}s. "  # noqa: E501
                        f"Processed {len(successful_nodes)} nodes."
                    )

                    completed_nodes += len(successful_nodes)

                    # Update successors for all successful nodes
                    self._update_all_successors(successful_nodes)

            total_time = time.time() - start_time

            logger.success(
                f"Graph execution completed successfully in {total_time:.3f}s. "
                f"Processed {completed_nodes} nodes across {len(self.execution_plan)} layers."  # noqa: E501
            )

            # Log final results summary
            # logger.info("=== FINAL EXECUTION RESULTS ===")
            # for node_id in self.graph.nodes():
            #     node_data = self.graph.nodes[node_id].get("data")
            #     if (
            #         node_data
            #         and hasattr(node_data, "output_values")
            #         and node_data.output_values
            #     ):
            #         for key, value in node_data.output_values.items():
            #             value_preview = (
            #                 str(value)[:100] + "..."
            #                 if len(str(value)) > 100
            #                 else str(value)
            #             )
            #             logger.info(f"  {node_id}.{key}: {value_preview}")
            #     else:
            #         logger.info(f"  {node_id}: no final outputs")

            self.end_event()

            return {
                "success": True,
                "total_nodes": total_nodes,
                "completed_nodes": completed_nodes,
                "total_layers": len(self.execution_plan),
                "execution_time": total_time,
            }

        except Exception as e:
            logger.error(f"Graph execution failed: {str(e)}")
            raise GraphExecutorError(f"Execution failed: {str(e)}") from e

    def _execute_layer_parallel(
        self, executor: ThreadPoolExecutor, layer_nodes: List[str], layer_index: int
    ) -> List[NodeExecutionResult]:
        """
        Execute all nodes in a layer in parallel.

        Args:
            executor: Thread pool executor
            layer_nodes: List of node IDs to execute
            layer_index: Current layer index

        Returns:
            List of execution results for all nodes in the layer
        """
        if not layer_nodes:
            logger.warning(f"Layer {layer_index} is empty")
            return []

        # For single node layers, execute directly (like old version)
        if len(layer_nodes) == 1:
            node_id = layer_nodes[0]
            logger.info(f"Executing single node in layer {layer_index}: {node_id}")
            return [self._execute_single_node_sync(node_id, layer_index)]

        # For multiple nodes, execute in parallel
        logger.info(
            f"Executing {len(layer_nodes)} nodes in parallel for layer {layer_index}"
        )

        # Submit all nodes to thread pool
        futures: Dict[Future, str] = {}

        for node_id in layer_nodes:
            try:
                # Get a deep copy of node data for thread safety
                node_data = self._get_node_data_copy(node_id)

                # Submit to thread pool
                future = executor.submit(
                    self._execute_single_node_thread, node_id, node_data, layer_index
                )
                futures[future] = node_id

                logger.debug(f"Submitted node {node_id} for parallel execution")

            except Exception as e:
                logger.error(f"Failed to submit node {node_id}: {str(e)}")
                return [
                    NodeExecutionResult(node_id=node_id, success=False, error=str(e))
                ]

        # Collect results as they complete
        results = []

        try:
            for future in as_completed(futures.keys()):
                node_id = futures[future]
                try:
                    result = future.result()
                    results.append(result)

                    if result.success:
                        logger.debug(
                            f"Node {node_id} completed successfully in {result.execution_time:.3f}s"  # noqa: E501
                        )
                    else:
                        logger.error(f"Node {node_id} failed: {result.error}")

                except Exception as e:
                    logger.error(f"Failed to get result for node {node_id}: {str(e)}")
                    results.append(
                        NodeExecutionResult(
                            node_id=node_id, success=False, error=str(e)
                        )
                    )

        except Exception as e:
            logger.error(f"Error collecting results for layer {layer_index}: {str(e)}")
            # Cancel remaining futures
            for future in futures.keys():
                future.cancel()
            raise

        return results

    def _execute_single_node_sync(
        self, node_id: str, layer_index: int
    ) -> NodeExecutionResult:
        """
        Execute a single node synchronously (like the old version).
        """
        start_time = time.time()

        try:
            self.push_event(node_id=node_id, event=NodeExecutionEvent.RUNNING, data={})
            # Get node configuration (same as old version)
            g_node = self.graph.nodes[node_id]
            node_spec: NodeSpec = g_node.get("spec")
            node_data: NodeData = g_node.get("data", NodeData())

            if not node_spec:
                raise GraphExecutorError(f"Node {node_id} missing specification")

            # Create node instance (same as old version)
            node_instance: Optional[Node] = self._node_registry.create_node_instance(
                node_spec.name
            )

            if not node_instance:
                raise GraphExecutorError(
                    f"Failed to create node instance: {node_spec.name}"
                )

            logger.info(f"Executing node [{layer_index}]: {node_spec.name}")

            # Execute the node (same as old version)
            executed_data: NodeData = node_instance.run(node_data)
            self.push_event(
                node_id=node_id,
                event=NodeExecutionEvent.SUCCESS,
                data=executed_data.model_dump(),
            )

            execution_time = time.time() - start_time

            # Log execution results
            if executed_data and executed_data.output_values:
                output_keys = list(executed_data.output_values.keys())
                logger.success(
                    f"Node {node_id} completed in {execution_time:.3f}s, outputs: {output_keys}"  # noqa: E501
                )
            else:
                logger.success(
                    f"Node {node_id} completed in {execution_time:.3f}s, no outputs"
                )

            return NodeExecutionResult(
                node_id=node_id,
                success=True,
                data=executed_data,
                execution_time=execution_time,
            )

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Node {node_id} execution failed: {str(e)}")
            self.push_event(
                node_id=node_id,
                event=NodeExecutionEvent.FAILED,
                data={},
            )
            return NodeExecutionResult(
                node_id=node_id,
                success=False,
                error=str(e),
                execution_time=execution_time,
            )

    def _execute_single_node_thread(
        self, node_id: str, node_data: NodeData, layer_index: int
    ) -> NodeExecutionResult:
        """
        Execute a single node in a thread (for parallel execution).
        """
        start_time = time.time()

        try:
            self.push_event(node_id=node_id, event=NodeExecutionEvent.RUNNING, data={})

            # Get node specification
            g_node = self.graph.nodes[node_id]
            node_spec: NodeSpec = g_node.get("spec")

            if not node_spec:
                raise GraphExecutorError(f"Node {node_id} missing specification")

            # Create node instance
            node_instance: Optional[Node] = self._node_registry.create_node_instance(
                node_spec.name
            )

            if not node_instance:
                raise GraphExecutorError(
                    f"Failed to create node instance: {node_spec.name}"
                )

            logger.info(f"Executing node [{layer_index}]: {node_spec.name} (parallel)")

            # Execute the node
            executed_data: NodeData = node_instance.run(node_data)
            self.push_event(
                node_id=node_id,
                event=NodeExecutionEvent.SUCCESS,
                data=executed_data.model_dump(),
            )
            execution_time = time.time() - start_time

            # Log execution results
            if executed_data and executed_data.output_values:
                output_keys = list(executed_data.output_values.keys())
                logger.success(
                    f"Node {node_id} completed in {execution_time:.3f}s (parallel), outputs: {output_keys}"  # noqa: E501
                )
            else:
                logger.success(
                    f"Node {node_id} completed in {execution_time:.3f}s (parallel), no outputs"  # noqa: E501
                )

            return NodeExecutionResult(
                node_id=node_id,
                success=True,
                data=executed_data,
                execution_time=execution_time,
            )

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Node {node_id} execution failed (parallel): {str(e)}")
            self.push_event(
                node_id=node_id,
                event=NodeExecutionEvent.FAILED,
                data={},
            )
            return NodeExecutionResult(
                node_id=node_id,
                success=False,
                error=str(e),
                execution_time=execution_time,
            )

    def _get_node_data_copy(self, node_id: str) -> NodeData:
        """
        Get a deep copy of node data for thread safety.
        """
        try:
            g_node = self.graph.nodes[node_id]
            node_data = g_node.get("data", NodeData())

            # Return deep copy for thread safety
            return copy.deepcopy(node_data)

        except Exception as e:
            logger.error(f"Failed to get data for node {node_id}: {str(e)}")
            return NodeData()

    def _update_all_successors(self, successful_results: List[NodeExecutionResult]):
        """
        Update all successor nodes with execution results.
        """
        for result in successful_results:
            try:
                successors = list(self.graph.successors(result.node_id))
                if successors:
                    logger.debug(
                        f"Updating {len(successors)} successors for node {result.node_id}"  # noqa: E501
                    )
                    self._update_successors(result.node_id, successors, result.data)
            except Exception as e:
                logger.error(
                    f"Failed to update successors for node {result.node_id}: {str(e)}"
                )

    def _update_successors(  # noqa: C901
        self, node_name: str, successors: List[str], executed_data: NodeData
    ):
        """
        Update successor nodes with output data from current node.

        This method keeps the exact same logic as your working old version.
        """
        if not executed_data or not executed_data.output_values:
            logger.warning(f"Node {node_name} has no output data to propagate")
            return

        # Use lock for thread safety when updating graph
        with self._update_lock:
            for successor_name in successors:
                try:
                    edge_data = self.graph.get_edge_data(node_name, successor_name)
                    if not edge_data:
                        logger.warning(
                            f"No edge data between {node_name} and {successor_name}"
                        )
                        continue

                    source_handle = edge_data.get("source_handle", "")
                    target_handle = edge_data.get("target_handle", "")

                    # Handle the -index splitting (same as old version)
                    if source_handle and "-index" in source_handle:
                        source_handle = source_handle.split("-index")[0]
                    if target_handle and "-index" in target_handle:
                        target_handle = target_handle.split("-index")[0]

                    if not source_handle or not target_handle:
                        logger.warning(
                            f"Invalid handles: source='{source_handle}', target='{target_handle}'"  # noqa: E501
                        )
                        continue

                    # Get successor node data (same as old version)
                    successor_node_data: NodeData = self.graph.nodes[
                        successor_name
                    ].get("data")

                    if successor_node_data is None:
                        successor_node_data = NodeData()

                    # Ensure input_values exists
                    if successor_node_data.input_values is None:
                        successor_node_data.input_values = {}

                    # Update successor input with current node output
                    if source_handle in executed_data.output_values:
                        successor_node_data.input_values[target_handle] = copy.deepcopy(
                            executed_data.output_values[source_handle]
                        )

                        # Update the graph (same as old version)
                        self.graph.nodes[successor_name]["data"] = successor_node_data

                        # Log data transfer
                        value_info = f"{type(executed_data.output_values[source_handle]).__name__}"  # noqa: E501
                        if hasattr(
                            executed_data.output_values[source_handle], "__len__"
                        ) and not isinstance(
                            executed_data.output_values[source_handle], str
                        ):
                            value_info += f"(len={len(executed_data.output_values[source_handle])})"  # noqa: E501

                        logger.debug(
                            f"Data flow: {node_name}.{source_handle} -> {successor_name}.{target_handle} ({value_info})"  # noqa: E501
                        )
                    else:
                        logger.warning(
                            f"Source handle '{source_handle}' not found in {node_name} outputs"  # noqa: E501
                        )

                except Exception as e:
                    logger.warning(
                        f"Failed to update successor {successor_name}: {str(e)}"
                    )

    def prepare(self):
        """Prepare method for backward compatibility."""
        logger.debug("GraphExecutor prepare() called - no preparation needed")
        pass
