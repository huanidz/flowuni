import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List

from loguru import logger
from src.consts.node_consts import NODE_EXECUTION_STATUS
from src.exceptions.execution_exceptions import GraphExecutorError
from src.executors.DataClass import NodeExecutionResult
from src.executors.NodeDataFlowAdapter import NodeDataFlowAdapter
from src.nodes.core import NodeInput, NodeOutput
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class RunFromNodeStrategy:
    """
    Strategy for executing the graph starting from a specific node.

    This strategy handles execution from a given node, including executing
    necessary ancestors first and then proceeding with the modified execution plan.
    """

    def __init__(self, graph_executor):
        """
        Initialize the RunFromNodeStrategy.

        Args:
            graph_executor: The GraphExecutor instance that owns this strategy
        """
        self.graph_executor = graph_executor

    def execute(self, start_node: str) -> Dict[str, Any]:
        """
        Execute the graph starting from a specific node.

        Args:
            start_node: The node ID to start execution from.

        Returns:
            Dict containing execution results
        """
        # Validate that the start_node exists in the graph
        if start_node not in self.graph_executor.graph.nodes:
            raise GraphExecutorError(f"Start node '{start_node}' not found in graph")

        logger.info(f"Starting execution from node: {start_node}")

        # Check if the start_node is a standalone node (no ancestors and no successors)
        ancestors = list(self.graph_executor.graph.predecessors(start_node))
        successors = list(self.graph_executor.graph.successors(start_node))

        if (not ancestors and not successors) or (
            self.graph_executor.execution_control.scope == "node_only"
        ):
            logger.info(f"Node '{start_node}' is a standalone node, executing it only")
            return self._execute_standalone_node(start_node)

        # Find all ancestors that need to be executed
        ancestors_to_execute = self._find_ancestors_to_execute(start_node)

        # Check if ancestors need to be executed first
        ancestors_to_run_first = []
        for ancestor_id in ancestors_to_execute:
            ancestor_data = self.graph_executor.graph.nodes[ancestor_id].get(
                "data", NodeData()
            )
            # If ancestor is not completed or has no valid output values, it needs to be executed
            if (
                ancestor_data.execution_status != NODE_EXECUTION_STATUS.COMPLETED
                or not ancestor_data.output_values
                or ancestor_data.output_values is False
            ):
                ancestors_to_run_first.append(ancestor_id)

        if ancestors_to_run_first:
            logger.info(
                f"Executing {len(ancestors_to_run_first)} ancestors first: {ancestors_to_run_first}"
            )
            # Execute the ancestors first
            ancestors_execution_result = self._execute_ancestors_first(
                ancestors_to_run_first
            )
            # Update the graph with the execution results
            self._update_graph_with_ancestor_results(ancestors_execution_result)

        # Now validate that all ancestors have been executed and have valid output values
        self._validate_ancestors_executed(ancestors_to_execute, start_node)

        # Prepare the start_node's input_values from ancestor output_values
        self._prepare_start_node_from_ancestors(start_node, ancestors_to_execute)

        # Modify the execution plan to start from the specified node
        modified_execution_plan = self._create_modified_execution_plan(start_node)

        # Execute the modified plan
        return self._execute_modified_plan(
            modified_execution_plan, ancestors_to_execute
        )

    def _find_ancestors_to_execute(self, start_node: str) -> List[str]:
        """
        Find all ancestors of the start node that need to be executed.

        Args:
            start_node: The node to find ancestors for

        Returns:
            List of ancestor node IDs that need to be executed
        """
        ancestors = set()

        # Use BFS to find all ancestors
        visited = set()
        queue = list(self.graph_executor.graph.predecessors(start_node))

        while queue:
            current_node = queue.pop(0)
            if current_node in visited:
                continue

            visited.add(current_node)
            ancestors.add(current_node)

            # Add predecessors of current node to queue
            queue.extend(self.graph_executor.graph.predecessors(current_node))

        logger.info(
            f"Found {len(ancestors)} ancestors for node {start_node}: {list(ancestors)}"
        )
        return list(ancestors)

    def _validate_ancestors_executed(
        self, ancestors: List[str], start_node: str
    ) -> None:
        """
        Validate that all ancestors have been executed and have valid output values.

        Args:
            ancestors: List of ancestor node IDs to validate
            start_node: The start node for context

        Raises:
            GraphExecutorError: If any ancestor is not properly executed
        """
        for ancestor_id in ancestors:
            ancestor_data = self.graph_executor.graph.nodes[ancestor_id].get(
                "data", NodeData()
            )

            # Check if ancestor has been executed
            if ancestor_data.execution_status != NODE_EXECUTION_STATUS.COMPLETED:
                raise GraphExecutorError(
                    f"Ancestor node '{ancestor_id}' has not been executed. "
                    f"Status: {ancestor_data.execution_status}"
                )

            # Check if ancestor has valid output values
            if not ancestor_data.output_values or ancestor_data.output_values is False:
                raise GraphExecutorError(
                    f"Ancestor node '{ancestor_id}' has no valid output values. "
                    f"Cannot start execution from node '{start_node}'"
                )

            logger.debug(
                f"Ancestor '{ancestor_id}' is properly executed with valid output values"
            )

    def _prepare_start_node_from_ancestors(
        self, start_node: str, ancestors: List[str]
    ) -> None:
        """
        Prepare the start_node's input_values from ancestor output_values.

        This method transfers data from ancestor nodes to the start_node using
        the NodeDataFlowAdapter.adapt() pattern, following the same logic as
        _update_normal_mode_successor but for ancestor-to-start-node data flow.

        Args:
            start_node: The node ID to prepare input_values for
            ancestors: List of ancestor node IDs that have output_values to transfer
        """
        try:
            # Get the start_node's graph node and data
            start_graph_node = self.graph_executor.graph.nodes.get(start_node)
            if start_graph_node is None:
                logger.error(f"Start node '{start_node}' not found in graph")
                return

            start_node_data: NodeData = start_graph_node.get("data", NodeData())
            start_node_spec = start_graph_node.get("spec")

            if start_node_data is None:
                start_node_data = NodeData()

            # Ensure the input_values dictionary exists
            if start_node_data.input_values is None:
                start_node_data.input_values = {}

            # For each ancestor, find connections to the start_node and transfer data
            for ancestor_id in ancestors:
                ancestor_graph_node = self.graph_executor.graph.nodes.get(ancestor_id)
                if ancestor_graph_node is None:
                    logger.warning(f"Ancestor node '{ancestor_id}' not found in graph")
                    continue

                ancestor_data: NodeData = ancestor_graph_node.get("data", NodeData())
                ancestor_spec = ancestor_graph_node.get("spec")

                if not ancestor_data.output_values:
                    logger.warning(
                        f"Ancestor node '{ancestor_id}' has no output values"
                    )
                    continue

                # Get edges from ancestor to start_node
                edge_data = self.graph_executor.graph.get_edge_data(
                    ancestor_id, start_node
                )
                if not edge_data:
                    logger.debug(
                        f"No direct edge from ancestor '{ancestor_id}' to start_node '{start_node}'"
                    )
                    continue

                # Handle the edge between ancestor and start_node
                # edge_data can be either a dict (single edge) or a dict of dicts (multiple edges)
                if isinstance(edge_data, dict):
                    # If it's a dict of dicts (multiple edges), iterate through them
                    edges_to_process = (
                        edge_data.items()
                        if any(isinstance(v, dict) for v in edge_data.values())
                        else [("single", edge_data)]
                    )
                else:
                    logger.warning(
                        f"Unexpected edge data type for edge from '{ancestor_id}' to '{start_node}': {type(edge_data)}"
                    )
                    continue

                # Handle each edge
                for edge_key, edge_info in edges_to_process:
                    source_handle = edge_info.get("source_handle", "")
                    target_handle = edge_info.get("target_handle", "")

                    # Handle the -index splitting (same as old version)
                    if source_handle and "-index" in source_handle:
                        source_handle = source_handle.split("-index")[0]
                    if target_handle and "-index" in target_handle:
                        target_handle = target_handle.split("-index")[0]

                    # Validate handles exist in specs
                    output_handle_from_ancestor: NodeOutput = next(
                        (
                            output
                            for output in ancestor_spec.outputs
                            if output.name == source_handle
                        ),
                        None,
                    )

                    input_handle_from_start_node: NodeInput = next(
                        (
                            input
                            for input in start_node_spec.inputs
                            if input.name == target_handle
                        ),
                        None,
                    )

                    if output_handle_from_ancestor is None:
                        logger.warning(
                            f"Source handle '{source_handle}' not found in ancestor '{ancestor_id}' outputs"
                        )
                        continue

                    if input_handle_from_start_node is None:
                        logger.warning(
                            f"Target handle '{target_handle}' not found in start_node '{start_node}' inputs"
                        )
                        continue

                    # Validate that the source handle exists in the ancestor's output data
                    if source_handle not in ancestor_data.output_values:
                        logger.warning(
                            f"Source handle '{source_handle}' not found in ancestor '{ancestor_id}' outputs"
                        )
                        continue

                    # Extract the output value from the ancestor
                    output_value_to_transfer: Dict[str, Any] = (
                        ancestor_data.output_values[source_handle]
                    )

                    # Adapt the output value to the target handle type using NodeDataFlowAdapter
                    adapted_output_value_to_transfer = NodeDataFlowAdapter.adapt(
                        output_data_to_transfer=output_value_to_transfer,
                        source_handle_type=type(output_handle_from_ancestor.type),
                        target_handle_type=type(input_handle_from_start_node.type),
                    )
                    logger.info(
                        f"👉 Adapted data transfer from ancestor '{ancestor_id}' to start_node '{start_node}': "
                        f"{source_handle} -> {target_handle} = {adapted_output_value_to_transfer}"
                    )

                    # Assign the adapted value to the target handle in start_node's input_values
                    start_node_data.input_values[target_handle] = (
                        adapted_output_value_to_transfer
                    )

            # Update the graph with the modified start_node data
            self.graph_executor.graph.nodes[start_node]["data"] = start_node_data
            logger.info(
                f"Prepared start_node '{start_node}' input_values from {len(ancestors)} ancestors"
            )

        except Exception as e:
            logger.error(
                f"Failed to prepare start_node '{start_node}' from ancestors: {str(e)}"
            )
            # Don't raise the exception as this shouldn't prevent execution

    def _create_modified_execution_plan(self, start_node: str) -> List[List[str]]:
        """
        Create a modified execution plan that starts from the specified node.

        Args:
            start_node: The node to start execution from

        Returns:
            Modified execution plan
        """
        # Find the layer index where the start_node is located
        start_layer_index = None
        for i, layer in enumerate(self.graph_executor.execution_plan):
            if start_node in layer:
                start_layer_index = i
                break

        if start_layer_index is None:
            raise GraphExecutorError(
                f"Start node '{start_node}' not found in execution plan"
            )

        logger.info(f"Start node '{start_node}' found in layer {start_layer_index}")

        # Create a new execution plan starting from the found layer
        modified_plan = []

        # Add all layers from the start layer onwards
        for i in range(start_layer_index, len(self.graph_executor.execution_plan)):
            modified_plan.append(self.graph_executor.execution_plan[i])

        # For the start layer, filter to include only the start_node and its descendants in the same layer
        start_layer = self.graph_executor.execution_plan[start_layer_index]
        filtered_start_layer = []

        for node_id in start_layer:
            # Include the start_node itself
            if node_id == start_node:
                filtered_start_layer.append(node_id)
            # Include other nodes in the same layer that are reachable from ancestors
            else:
                # Check if this node has all ancestors executed (including the start_node if it's a predecessor)
                if self._is_node_ready_for_execution(node_id, start_node):
                    filtered_start_layer.append(node_id)

        modified_plan[0] = filtered_start_layer

        logger.info(
            f"Modified execution plan starting from layer {start_layer_index}: {modified_plan}"
        )
        return modified_plan

    def _is_node_ready_for_execution(self, node_id: str, start_node: str) -> bool:
        """
        Check if a node is ready for execution based on its predecessors.

        Args:
            node_id: The node to check
            start_node: The start node for this execution

        Returns:
            True if the node is ready for execution
        """
        # Get all predecessors of this node
        predecessors = list(self.graph_executor.graph.predecessors(node_id))

        if not predecessors:
            return True

        # Check if all predecessors have been executed
        for pred_id in predecessors:
            pred_data = self.graph_executor.graph.nodes[pred_id].get("data", NodeData())

            if pred_data.execution_status != NODE_EXECUTION_STATUS.COMPLETED:
                return False

            # Check if predecessor has valid output values
            if not pred_data.output_values or pred_data.output_values is False:
                return False

        return True

    def _execute_modified_plan(
        self,
        execution_plan: List[List[str]],
        ancestors: List[str],
    ) -> Dict[str, Any]:
        """
        Execute a modified execution plan.

        Args:
            execution_plan: The modified execution plan
            ancestors: List of ancestors that were already executed

        Returns:
            Dict containing execution results
        """
        start_time = time.time()
        total_nodes = sum(len(layer) for layer in execution_plan) + len(
            ancestors
        )  # Include ancestors in total
        completed_nodes = len(ancestors)  # Ancestors are already completed

        # Publish the queue event for all nodes in each layer
        for layer_index, layer_nodes in enumerate(execution_plan, start=1):
            for node_id in layer_nodes:
                self.graph_executor.push_event(
                    node_id=node_id,
                    event=NODE_EXECUTION_STATUS.QUEUED,
                    data={},
                )

        try:
            # Use ThreadPoolExecutor for parallel execution within layers
            with ThreadPoolExecutor(
                max_workers=self.graph_executor.max_workers
            ) as executor:
                for layer_index, layer_nodes in enumerate(execution_plan, 1):
                    layer_start_time = time.time()

                    # Execute all nodes in this layer in parallel
                    layer_results = self.graph_executor._execute_layer_parallel(
                        executor, layer_nodes, layer_index
                    )

                    layer_execution_time = time.time() - layer_start_time

                    # Check for failures
                    failed_nodes = [r for r in layer_results if not r.success]
                    successful_nodes = [r for r in layer_results if r.success]

                    if failed_nodes:
                        error_msg = f"Layer {layer_index} execution failed. Failed nodes: {[r.node_id for r in failed_nodes]}"
                        logger.error(error_msg)

                        for result in failed_nodes:
                            logger.error(
                                f"Node {result.node_id} failed: {result.error}"
                            )

                        raise GraphExecutorError(error_msg)

                    logger.success(
                        f"Layer {layer_index} completed successfully in {layer_execution_time:.3f}s. "
                        f"Processed {len(successful_nodes)} nodes."
                    )

                    completed_nodes += len(successful_nodes)

                    # Update successors for all successful nodes
                    self.graph_executor._update_all_successors(successful_nodes)

            total_time = time.time() - start_time

            logger.success(
                f"Graph execution completed successfully in {total_time:.3f}s. "
                f"Processed {completed_nodes} nodes across {len(execution_plan)} layers."
            )

            # Collect results from the final layer
            final_layer_results = []
            if layer_results:
                final_layer_results = [
                    {
                        "node_id": result.node_id,
                        "success": result.success,
                        "data": result.data.model_dump() if result.data else None,
                        "error": result.error,
                        "execution_time": result.execution_time,
                    }
                    for result in layer_results
                ]

            execute_result = {
                "success": True,
                "total_nodes": total_nodes,
                "completed_nodes": completed_nodes,
                "total_layers": len(execution_plan),
                "execution_time": total_time,
                "results": final_layer_results,
                "ancestors": ancestors,  # Include ancestors in the result
            }

            self.graph_executor.end_event(data=execute_result)

            return execute_result

        except Exception as e:
            raise GraphExecutorError(f"Execution failed: {str(e)}.") from e

    def _execute_ancestors_first(
        self, ancestors_to_run: List[str]
    ) -> List[NodeExecutionResult]:
        """
        Execute a list of ancestors first to get their output values.

        Args:
            ancestors_to_run: List of ancestor node IDs to execute

        Returns:
            List of execution results for the ancestors
        """
        logger.info(f"Executing ancestors first: {ancestors_to_run}")

        # Create a simple execution plan for just the ancestors
        # This is a simplified version that executes ancestors in sequence
        results = []

        for ancestor_id in ancestors_to_run:
            try:
                # Publish queue event
                self.graph_executor.push_event(
                    node_id=ancestor_id,
                    event=NODE_EXECUTION_STATUS.QUEUED,
                    data={},
                )

                # Execute the ancestor
                result = self.graph_executor._execute_single_node(ancestor_id, 1)
                results.append(result)

                # Update successors with the ancestor's output
                if result.success:
                    self.graph_executor._update_all_successors([result])

            except Exception as e:
                logger.error(f"Failed to execute ancestor {ancestor_id}: {str(e)}")
                results.append(
                    NodeExecutionResult(
                        node_id=ancestor_id,
                        success=False,
                        error=str(e),
                    )
                )

        return results

    def _update_graph_with_ancestor_results(
        self, ancestor_results: List[NodeExecutionResult]
    ) -> None:
        """
        Update the graph with execution results from ancestors.

        Args:
            ancestor_results: List of execution results for ancestors
        """
        for result in ancestor_results:
            if result.success and result.data:
                # Update the graph node with the executed data
                self.graph_executor.graph.nodes[result.node_id]["data"] = result.data
                logger.debug(
                    f"Updated graph with ancestor result for node {result.node_id}"
                )

    def _execute_standalone_node(self, start_node: str) -> Dict[str, Any]:
        """
        Execute a standalone node (no ancestors and no successors).

        Args:
            start_node: The node ID to execute

        Returns:
            Dict containing execution results
        """
        start_time = time.time()

        # Publish queue event for the standalone node
        self.graph_executor.push_event(
            node_id=start_node,
            event=NODE_EXECUTION_STATUS.QUEUED,
            data={},
        )

        try:
            # Execute the standalone node
            layer_results = [self.graph_executor._execute_single_node(start_node, 1)]

            # Check for failure
            failed_nodes = [r for r in layer_results if not r.success]
            successful_nodes = [r for r in layer_results if r.success]

            if failed_nodes:
                error_msg = f"Standalone node execution failed. Failed nodes: {[r.node_id for r in failed_nodes]}"
                logger.error(error_msg)

                for result in failed_nodes:
                    logger.error(f"Node {result.node_id} failed: {result.error}")

                raise GraphExecutorError(error_msg)

            total_time = time.time() - start_time

            logger.success(
                f"Standalone node execution completed successfully in {total_time:.3f}s. "
                f"Processed {len(successful_nodes)} nodes."
            )

            # Collect results
            final_layer_results = [
                {
                    "node_id": result.node_id,
                    "success": result.success,
                    "data": result.data.model_dump() if result.data else None,
                    "error": result.error,
                    "execution_time": result.execution_time,
                }
                for result in layer_results
            ]

            execute_result = {
                "success": True,
                "total_nodes": 1,
                "completed_nodes": 1,
                "total_layers": 1,
                "execution_time": total_time,
                "results": final_layer_results,
                "ancestors": [],  # No ancestors for standalone node
            }

            self.graph_executor.end_event(data=execute_result)

            return execute_result

        except Exception as e:
            raise GraphExecutorError(f"Execution failed: {str(e)}.") from e
