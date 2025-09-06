import copy
import json
import threading
import time
import traceback
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional

import networkx as nx
from loguru import logger
from pydantic import BaseModel
from src.consts.node_consts import (
    NODE_DATA_MODE,
    NODE_EXECUTION_STATUS,
    NODE_LABEL_CONSTS,
    SPECIAL_NODE_INPUT_CONSTS,
)
from src.executors.ExecutionContext import ExecutionContext, ExecutionControl
from src.executors.NodeDataFlowAdapter import NodeDataFlowAdapter
from src.nodes.core import NodeInput, NodeOutput

# Special imports
from src.nodes.handles.basics.outputs.RouterOutputHandle import RouterOutputData
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_graph_schemas import NodeData
from src.schemas.nodes.node_data_parsers import ToolDataParser


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
        execution_control: ExecutionControl,
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
        self.execution_control = execution_control
        self.max_workers = max_workers

        # Flag and class for execution context
        self.enable_debug = enable_debug
        self.execution_context = execution_context

        # Thread safety for updating graph
        self._update_lock = threading.Lock()

        # Create node registry instance
        self._node_registry = NodeRegistry()

    def push_event(self, node_id: str, event: str, data: Any = {}):
        # Publish node event to Redis
        if self.execution_context and self.enable_debug:
            self.execution_context.publish_node_event(
                node_id=node_id, event=event, data=data
            )

    def end_event(self, data: Dict = {}):
        # Publish DONE event to Redis
        if self.execution_context and self.enable_debug:
            self.execution_context.end(data=data)

    def execute(self) -> Dict[str, Any]:
        """
        Execute the graph with parallel processing within layers.

        This is the synchronous version that matches your old working code structure.
        Checks the execution control to determine if execution should start from a specific node.
        """

        # Check if we should start execution from a specific node
        if self.execution_control.start_node is not None:
            return self._run_from_node(self.execution_control.start_node)

        # Otherwise, execute from the beginning
        return self._execute_full_graph()

    def _execute_full_graph(self) -> Dict[str, Any]:
        """
        Execute the full graph from the beginning.
        """
        start_time = time.time()
        total_nodes = sum(len(layer) for layer in self.execution_plan)
        completed_nodes = 0

        # Publish the queue event for all nodes in each layer
        # Except for the first layer because it will be executed immediately
        for layer_index, layer_nodes in enumerate(self.execution_plan, start=1):
            for node_id in layer_nodes:
                self.push_event(
                    node_id=node_id,
                    event=NODE_EXECUTION_STATUS.QUEUED,
                    data={},
                )

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
                "total_layers": len(self.execution_plan),
                "execution_time": total_time,
                "results": final_layer_results,
            }

            # logger.info(f"👉 execute_result: {execute_result}")

            self.end_event(data=execute_result)

            return execute_result

        except Exception as e:
            raise GraphExecutorError(f"Execution failed: {str(e)}.") from e

    def _execute_layer_parallel(
        self, executor: ThreadPoolExecutor, layer_nodes: List[str], layer_index: int
    ) -> List[NodeExecutionResult]:
        """
        Execute all nodes in a layer in parallel.
        """
        if not layer_nodes:
            logger.warning(f"Layer {layer_index} is empty")
            return []

        # Filter out nodes that should be skipped based on their predecessors
        executable_nodes = []
        skipped_results = []

        for node_id in layer_nodes:
            if self._validate_node_skip_status_before_execution(node_id):
                executable_nodes.append(node_id)
            else:
                # Create a skipped result for this node
                node_data = self.graph.nodes[node_id].get("data", NodeData())
                self.push_event(
                    node_id=node_id,
                    event=NODE_EXECUTION_STATUS.SKIPPED,
                    data={},
                )
                skipped_results.append(
                    NodeExecutionResult(
                        node_id=node_id,
                        success=True,  # Skipped is considered successful
                        data={},
                    )
                )

        logger.info(
            f"Layer {layer_index}: {len(executable_nodes)} executable, {len(skipped_results)} skipped"
        )

        if not executable_nodes:
            logger.info(f"All nodes in layer {layer_index} are skipped")
            return skipped_results

        # Execute only the non-skipped nodes
        if len(executable_nodes) == 1:
            node_id = executable_nodes[0]
            logger.info(f"Executing single node in layer {layer_index}: {node_id}")
            execution_results = [self._execute_single_node(node_id, layer_index)]
        else:
            logger.info(
                f"Executing {len(executable_nodes)} nodes in parallel for layer {layer_index}"
            )

            # Submit all executable nodes to thread pool
            futures: Dict[Future, str] = {}

            for node_id in executable_nodes:
                try:
                    node_data = self._get_node_data_copy(node_id)
                    future = executor.submit(
                        self._execute_single_node, node_id, layer_index, node_data
                    )
                    futures[future] = node_id
                    logger.debug(f"Submitted node {node_id} for parallel execution")
                except Exception as e:
                    logger.error(f"Failed to submit node {node_id}: {str(e)}")
                    return [
                        NodeExecutionResult(
                            node_id=node_id, success=False, error=str(e)
                        )
                    ]

            # Collect results as they complete
            execution_results = []
            try:
                for future in as_completed(futures.keys()):
                    node_id = futures[future]
                    try:
                        result = future.result()
                        execution_results.append(result)

                        if result.success:
                            logger.debug(
                                f"Node {node_id} completed successfully in {result.execution_time:.3f}s"
                            )
                        else:
                            logger.error(f"Node {node_id} failed: {result.error}")

                    except Exception as e:
                        logger.error(
                            f"Failed to get result for node {node_id}: {str(e)}"
                        )
                        execution_results.append(
                            NodeExecutionResult(
                                node_id=node_id, success=False, error=str(e)
                            )
                        )
            except Exception as e:
                logger.error(
                    f"Error collecting results for layer {layer_index}: {str(e)}"
                )
                for future in futures.keys():
                    future.cancel()
                raise

        # Combine execution results with skipped results
        all_results = execution_results + skipped_results
        return all_results

    def _execute_single_node(
        self, node_id: str, layer_index: int, node_data: Optional[NodeData] = None
    ) -> NodeExecutionResult:
        """
        Execute a single node (works for both sync and parallel execution).

        Args:
            node_id: ID of the node to execute
            layer_index: Current layer index for logging
            node_data: Pre-fetched node data (for parallel execution) or None (for sync)
        """
        start_time = time.time()

        try:
            self.push_event(
                node_id=node_id, event=NODE_EXECUTION_STATUS.RUNNING, data={}
            )

            # Get node configuration
            g_node = self.graph.nodes[node_id]
            node_spec: NodeSpec = g_node.get("spec")
            # logger.info(f"👉 node_spec: {node_spec}")

            if not node_spec:
                raise GraphExecutorError(f"Node {node_id} missing specification")

            # Get node data - either from parameter (parallel) or from graph (sync)
            if node_data is None:
                # Sync mode: fetch from graph and do detailed logging
                node_data = g_node.get("data", NodeData())
                logger.info(f"NodeData: {node_data.model_dump_json(indent=2)}")

            # Check for skipping
            if node_data.execution_status == NODE_EXECUTION_STATUS.SKIPPED:
                logger.info(f"Node {node_id} is skipped")
                self.push_event(
                    node_id=node_id,
                    event=NODE_EXECUTION_STATUS.SKIPPED,
                    data=node_data.model_dump(),
                )
                return NodeExecutionResult(
                    node_id=node_id,
                    success=True,
                    data=node_data.model_dump(),
                )

            # Handling special node that require non-DAG data-flow
            # But this only used to prepare input values, the whole execution is still in DAG style # noqa: E501
            node_data = self.prepare_node_data_for_execution(
                node_id=node_id, node_data=node_data
            )

            # logger.info(f"👉 node_data (After prepare): {node_data}")

            # Create node instance
            node_instance: Optional[Node] = self._node_registry.create_node_instance(
                node_spec.name
            )

            if not node_instance:
                raise GraphExecutorError(
                    f"Failed to create node instance: {node_spec.name}"
                )

            logger.info(f"Executing node [{layer_index}]: {node_spec.name}")

            # Execute the node
            executed_data: NodeData = node_instance.run(node_data)
            self.push_event(
                node_id=node_id,
                event=NODE_EXECUTION_STATUS.COMPLETED,
                data=executed_data.model_dump(),
            )

            execution_time = time.time() - start_time

            return NodeExecutionResult(
                node_id=node_id,
                success=True,
                data=executed_data,
                execution_time=execution_time,
            )

        except Exception as e:
            execution_time = time.time() - start_time
            trace = traceback.format_exc()
            logger.error(
                f"❌ Node {node_id} execution failed 🛑: {str(e)}\n🔍 Trace: {trace}"
            )

            self.push_event(
                node_id=node_id,
                event=NODE_EXECUTION_STATUS.FAILED,
                data={"error": str(e)},
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

    def _update_successors(
        self, node_id: str, successors: List[str], executed_data: NodeData
    ):
        """
        Update successor nodes with output data from current node.

        This method orchestrates the updating of successors by delegating to
        specialized functions based on the connection type and mode.
        """

        logger.debug(
            f"Updating successors for node {node_id}, with data: {executed_data}"
        )

        if not executed_data or not executed_data.output_values:
            # TODO: Careful in the future if a node is only is in Tool mode and not support normal mode # noqa
            logger.warning(f"Node {node_id} has no output data to propagate")
            return

        SOURCE_MODE: str = executed_data.mode  # Either NormalMode or ToolMode

        # Use lock for thread safety when updating graph
        with self._update_lock:
            for successor_node_id in successors:
                try:
                    edge_data = self.graph.get_edge_data(node_id, successor_node_id)
                    if not edge_data:
                        logger.warning(
                            f"No edge data between {node_id} and {successor_node_id}"
                        )
                        continue

                    successor_node_instance = self.graph.nodes.get(successor_node_id)
                    successor_node_data: NodeData = successor_node_instance.get("data")

                    # If successor node's exec state is in SKIPPED, then skip this node.
                    if (
                        successor_node_data.execution_status
                        == NODE_EXECUTION_STATUS.SKIPPED
                    ):
                        logger.warning(
                            f"Successor node {successor_node_id} is SKIPPED, skipping in the update."  # noqa E501
                        )
                        continue

                    source_handle = edge_data.get("source_handle", "")
                    target_handle = edge_data.get("target_handle", "")

                    # Handle the -index splitting (same as old version)
                    if source_handle and "-index" in source_handle:
                        source_handle = source_handle.split("-index")[0]
                    if target_handle and "-index" in target_handle:
                        target_handle = target_handle.split("-index")[0]

                    # Handle tool mode case using the dedicated function
                    if (source_handle is None) and (SOURCE_MODE == NODE_DATA_MODE.TOOL):
                        self._update_tool_mode_successor(
                            node_id, successor_node_id, target_handle, executed_data
                        )
                        continue

                    # Validate handles for normal mode
                    if not source_handle or not target_handle:
                        logger.warning(
                            f"Invalid handles: source='{source_handle}', target='{target_handle}'"  # noqa
                        )
                        continue

                    # Handle normal mode case using the dedicated function
                    self._update_normal_mode_successor(
                        node_id,
                        successor_node_id,
                        source_handle,
                        target_handle,
                        executed_data,
                    )

                except Exception as e:
                    logger.warning(
                        f"Failed to update successor {successor_node_id}: {str(e)}"
                    )

    def _update_normal_mode_successor(
        self,
        node_id: str,
        successor_node_id: str,
        source_handle: str,
        target_handle: str,
        executed_data: NodeData,
    ) -> None:
        """
        Handle normal mode successor updates with maximum readability.

        This method handles the standard case where data flows from a source handle
        to a target handle between nodes in normal mode. The implementation prioritizes
        clarity and explicit error handling over brevity.

        Args:
            node_id: Name of the source node that produced the data
            successor_node_id: Name of the successor node to update with new data
            source_handle: Source handle name for the outgoing connection
            target_handle: Target handle name for the incoming connection
            executed_data: Executed data from the source node containing outputs

        Raises:
            Exception: Re-raises any exception that occurs during the update process
        """

        # logger.info(f"👉 executed_data: {executed_data}")

        try:
            current_node_label: str = executed_data.node_type
            edge_id = self.graph.get_edge_data(node_id, successor_node_id).get("id")

            # Step 0: Retrieve the current_node from the graph
            current_graph_node = self.graph.nodes.get(node_id)
            if current_graph_node is None:
                error_message = f"Current node '{node_id}' not found in graph"
                logger.error(error_message)
                raise ValueError(error_message)

            # Step 1: Retrieve the successor node from the graph
            successor_graph_node = self.graph.nodes.get(successor_node_id)
            if successor_graph_node is None:
                error_message = (
                    f"Successor node '{successor_node_id}' not found in graph"
                )
                logger.error(error_message)
                raise ValueError(error_message)

            # Step 2: Extract or initialize the node data
            current_node_spec: NodeSpec = current_graph_node.get("spec")

            successor_node_data: NodeData = successor_graph_node.get("data")
            successor_node_spec: NodeSpec = successor_graph_node.get("spec")

            # Find and get the target handle
            output_handle_from_current_node: NodeOutput = next(
                (
                    output
                    for output in current_node_spec.outputs
                    if output.name == source_handle
                ),
                None,
            )

            # Find and get the source handle
            input_handle_from_successor_node: NodeInput = next(
                (
                    input
                    for input in successor_node_spec.inputs
                    if input.name == target_handle
                ),
                None,
            )

            if output_handle_from_current_node is None:
                logger.error(
                    f"Source handle '{source_handle}' not found in node '{node_id}' outputs"  # noqa
                )
                raise ValueError(
                    f"Source handle '{source_handle}' not found in node '{node_id}' outputs"  # noqa
                )

            if input_handle_from_successor_node is None:
                logger.error(
                    f"Target handle '{target_handle}' not found in node '{successor_node_id}' inputs"  # noqa
                )
                raise ValueError(
                    f"Target handle '{target_handle}' not found in node '{successor_node_id}' inputs"  # noqa
                )

            if successor_node_data is None:
                successor_node_data = NodeData()

            # Step 3: Ensure the input_values dictionary exists
            if successor_node_data.input_values is None:
                successor_node_data.input_values = {}

            # Step 4: Validate that the source handle exists in the executed data
            if source_handle not in executed_data.output_values:
                logger.warning(
                    f"Source handle '{source_handle}' not found in {node_id} outputs"
                )
                return  # Exit early if source handle doesn't exist

            # Step 5: Extract the output value from the source handle
            output_value_to_transfer: Dict[str, Any] = executed_data.output_values[
                source_handle
            ]

            if current_node_label == NODE_LABEL_CONSTS.ROUTER:
                parsed_router_output_value = RouterOutputData(
                    **output_value_to_transfer
                )

                # Extract the output route labels.
                route_label_decisons: List[str] = (
                    parsed_router_output_value.route_label_decisons.split(",")
                )[:1]
                logger.info(f"👉 route_label_decisons: {route_label_decisons}")

                # If the edge_id is not in the label decisons, then the exec_status of that succesor node will be set to SKIPPED. # noqa E501
                logger.info(f"👉 edge_id: {edge_id}")
                if edge_id not in route_label_decisons:
                    successor_node_data.execution_status = NODE_EXECUTION_STATUS.SKIPPED
                    self.graph.nodes[successor_node_id]["data"] = successor_node_data
                    return

            # Step 6. Adapt the output value to the target handle type
            adapted_output_value_to_transfer = NodeDataFlowAdapter.adapt(
                output_data_to_transfer=output_value_to_transfer,
                source_handle_type=type(output_handle_from_current_node.type),
                target_handle_type=type(input_handle_from_successor_node.type),
            )
            logger.info(
                f"👉 adapted_output_value_to_transfer: {adapted_output_value_to_transfer}"
            )

            # Step 7: Assign the copied value to the target handle
            successor_node_data.input_values[target_handle] = (
                adapted_output_value_to_transfer
            )

            # Step 8: Update the graph with the modified node data
            self.graph.nodes[successor_node_id]["data"] = successor_node_data

            # Step 9: Log successful completion
            logger.debug(
                f"Successfully updated normal mode successor {successor_node_id}: "
                f"{source_handle} -> {target_handle}"
            )

        except Exception as exception:
            logger.error(
                f"Failed to update normal mode successor {successor_node_id}: {str(exception)}"  # noqa
            )
            raise

    def _update_tool_mode_successor(  # noqa
        self,
        node_id: str,
        successor_node_id: str,
        target_handle: str,
        executed_data: NodeData,
    ) -> None:
        """
        Handle tool mode successor updates with maximum readability.

        This method specifically handles the case where source_handle is None
        and SOURCE_MODE is TOOL mode, updating the tool_serialized_schemas
        for the successor node. The implementation prioritizes clarity and
        explicit error handling over brevity.

        Args:
            node_id: Name of the source node that produced the tool data
            successor_node_id: Name of the successor node to update with tool schemas
            target_handle: Target handle for the incoming tool schema connection
            executed_data: Executed data from the source node containing tool outputs

        Raises:
            Exception: Re-raises any exception that occurs during the update process
        """
        try:
            # Step 1: Retrieve the successor node from the graph
            successor_graph_node = self.graph.nodes.get(successor_node_id)
            if successor_graph_node is None:
                error_message = (
                    f"Successor node '{successor_node_id}' not found in graph"
                )
                logger.error(error_message)
                raise ValueError(error_message)

            # Step 2: Extract or initialize the node data
            successor_node_data: NodeData = successor_graph_node.get("data")

            if successor_node_data is None:
                successor_node_data = NodeData()

            # Step 3: Ensure the input_values dictionary exists
            if successor_node_data.input_values is None:
                successor_node_data.input_values = {}

            # Step 4: Validate required tool data exists in executed data
            required_tool_keys = ["tool", "tool_name", "tool_description"]
            missing_keys = []

            for required_key in required_tool_keys:
                if required_key not in executed_data.output_values:
                    missing_keys.append(required_key)

            if missing_keys:
                error_message = (
                    f"Missing required tool data keys in node '{node_id}': {missing_keys}. "  # noqa
                    f"Available keys: {list(executed_data.output_values.keys())}"
                )
                logger.error(error_message)
                raise ValueError(error_message)

            # Step 5: Extract tool information from executed data
            raw_tool_schema = executed_data.output_values["tool"]
            # logger.info(f"👉 raw_tool_schema: {raw_tool_schema}")
            tool_name = executed_data.output_values["tool_name"]
            # logger.info(f"👉 tool_name: {tool_name}")
            tool_description = executed_data.output_values["tool_description"]
            # logger.info(f"👉 tool_description: {tool_description}")

            # Step 6: Parse the tool schema JSON
            try:
                if raw_tool_schema is None:
                    # If raw_tool_schema is None, set parsed_tool_schema to None, This is expected when the tool is no-toolable-param (just execute) # noqa E501
                    parsed_tool_schema = None
                else:
                    parsed_tool_schema = json.loads(raw_tool_schema)
            except json.JSONDecodeError as json_error:
                error_message = (
                    f"Invalid JSON in tool schema from node '{node_id}': {json_error}"
                )
                logger.error(error_message)
                raise ValueError(error_message) from json_error

            # Step 7: Create the tool data parser object
            tool_data_parser = ToolDataParser(
                from_node_id=node_id,
                input_values=executed_data.input_values,
                parameter_values=executed_data.parameter_values,
                tool_origin=executed_data.node_type,
                tool_schema=parsed_tool_schema,
                tool_name=tool_name,
                tool_description=tool_description,
            )

            # Step 8: Get current schemas from the target handle
            current_target_data = successor_node_data.input_values.get(
                target_handle, ""
            )

            # Step 9: Parse existing schemas or initialize empty list
            if current_target_data == "":
                existing_tool_schemas = []
            else:
                try:
                    existing_tool_schemas: List[Dict[str, Any]] = json.loads(
                        current_target_data
                    )
                except json.JSONDecodeError as json_error:
                    logger.warning(
                        f"Invalid JSON in existing tool schemas for '{successor_node_id}', "  # noqa
                        f"initializing with empty list: {json_error}"
                    )
                    existing_tool_schemas = []

            # Step 10: Add the new tool schema to the existing schemas
            new_tool_schema_dict = tool_data_parser.model_dump()
            updated_tool_schemas = existing_tool_schemas + [new_tool_schema_dict]

            # Step 11: Serialize the updated schemas back to JSON string
            try:
                serialized_updated_schemas = json.dumps(updated_tool_schemas)
            except (TypeError, ValueError) as serialization_error:
                error_message = (
                    f"Failed to serialize updated tool schemas for '{successor_node_id}': "  # noqa
                    f"{serialization_error}"
                )
                logger.error(error_message)
                raise ValueError(error_message) from serialization_error

            # Step 12: Update the successor node with the new schemas
            successor_node_data.input_values[target_handle] = serialized_updated_schemas

            # Step 13: Save the updated node data back to the graph
            self.graph.nodes[successor_node_id]["data"] = successor_node_data

            # Step 14: Log successful completion
            logger.debug(
                f"Successfully updated tool schemas for successor {successor_node_id}: "
                f"Added tool '{tool_name}' from node '{node_id}'"
            )

        except Exception as exception:
            logger.error(
                f"Failed to update tool mode successor {successor_node_id}: {str(exception)}"  # noqa
            )
            raise

    def prepare_node_data_for_execution(
        self, node_id: str, node_data: NodeData
    ) -> NodeData:
        """Prepare method for node_data before execution."""

        if node_data.label == NODE_LABEL_CONSTS.ROUTER:
            # First, get the outgoing edges from this node
            # make a string that contain edge ids separated by comma. e.g. "edge_id_1,edge_id_2,edge_id_3"

            # Get all outgoing edges from this node
            outgoing_edges = self.graph.out_edges(node_id, data=True)

            # Extract edge IDs and create comma-separated string
            edge_ids = []
            for source, target, edge_data in outgoing_edges:
                # edge ID is stored in the edge data
                edge_id = edge_data.get("id")
                edge_ids.append(edge_id)

            if not edge_ids:
                logger.warning(
                    f"No outgoing edges found for Node {NODE_LABEL_CONSTS.ROUTER} {node_id}"  # noqa E501
                )
                return node_data

            # Create the comma-separated string of edge IDs
            edge_ids_string = ",".join(edge_ids)
            logger.info(f"👉 edge_ids_string: {edge_ids_string}")

            node_data.input_values[SPECIAL_NODE_INPUT_CONSTS.ROUTER_ROUTE_LABELS] = (
                edge_ids_string
            )

            logger.debug(
                f"Router node {node_id} prepared with edge IDs: {edge_ids_string}"
            )

            return node_data

        else:
            return node_data

    def _validate_node_skip_status_before_execution(self, node_id: str) -> bool:
        """
        Validate if a node should be skipped based on its predecessors.

        Args:
            node_id: The node to validate

        Returns:
            bool: True if the node should be executed, False if it should be skipped
        """
        # Get all predecessors of this node
        predecessors = list(self.graph.predecessors(node_id))

        if not predecessors:
            # No predecessors, check the node's own status
            node_data = self.graph.nodes[node_id].get("data", NodeData())
            return node_data.execution_status != NODE_EXECUTION_STATUS.SKIPPED

        # Check if any predecessor is SKIPPED
        for pred_id in predecessors:
            pred_node = self.graph.nodes[pred_id]
            pred_data = pred_node.get("data", NodeData())

            if pred_data.execution_status == NODE_EXECUTION_STATUS.SKIPPED:
                # At least one predecessor is skipped, so this node should be skipped too
                logger.info(
                    f"Node {node_id} should be skipped due to skipped predecessor {pred_id}"
                )

                # Mark this node as SKIPPED
                current_node_data = self.graph.nodes[node_id].get("data", NodeData())
                current_node_data.execution_status = NODE_EXECUTION_STATUS.SKIPPED
                self.graph.nodes[node_id]["data"] = current_node_data

                return False

        # All predecessors are not skipped, check the node's own status
        node_data = self.graph.nodes[node_id].get("data", NodeData())
        return node_data.execution_status != NODE_EXECUTION_STATUS.SKIPPED

    def _run_from_node(self, start_node: str) -> Dict[str, Any]:
        """
        Execute the graph starting from a specific node.

        Args:
            start_node: The node ID to start execution from.

        Returns:
            Dict containing execution results
        """
        # Validate that the start_node exists in the graph
        if start_node not in self.graph.nodes:
            raise GraphExecutorError(f"Start node '{start_node}' not found in graph")

        logger.info(f"Starting execution from node: {start_node}")

        # Check if the start_node is a standalone node (no ancestors and no successors)
        ancestors = list(self.graph.predecessors(start_node))
        successors = list(self.graph.successors(start_node))

        if not ancestors and not successors:
            logger.info(f"Node '{start_node}' is a standalone node, executing it only")
            return self._execute_standalone_node(start_node)

        # Find all ancestors that need to be executed
        ancestors_to_execute = self._find_ancestors_to_execute(start_node)

        # Validate that all ancestors have been executed
        self._validate_ancestors_executed(ancestors_to_execute, start_node)

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
        queue = list(self.graph.predecessors(start_node))

        while queue:
            current_node = queue.pop(0)
            if current_node in visited:
                continue

            visited.add(current_node)
            ancestors.add(current_node)

            # Add predecessors of current node to queue
            queue.extend(self.graph.predecessors(current_node))

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
            ancestor_data = self.graph.nodes[ancestor_id].get("data", NodeData())

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
        for i, layer in enumerate(self.execution_plan):
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
        for i in range(start_layer_index, len(self.execution_plan)):
            modified_plan.append(self.execution_plan[i])

        # For the start layer, filter to include only the start_node and its descendants in the same layer
        start_layer = self.execution_plan[start_layer_index]
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
        predecessors = list(self.graph.predecessors(node_id))

        if not predecessors:
            return True

        # Check if all predecessors have been executed
        for pred_id in predecessors:
            pred_data = self.graph.nodes[pred_id].get("data", NodeData())

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
            execution_control: Execution control for this run
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
                self.push_event(
                    node_id=node_id,
                    event=NODE_EXECUTION_STATUS.QUEUED,
                    data={},
                )

        try:
            # Use ThreadPoolExecutor for parallel execution within layers
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                for layer_index, layer_nodes in enumerate(execution_plan, 1):
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
                    self._update_all_successors(successful_nodes)

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

            self.end_event(data=execute_result)

            return execute_result

        except Exception as e:
            raise GraphExecutorError(f"Execution failed: {str(e)}.") from e

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
        self.push_event(
            node_id=start_node,
            event=NODE_EXECUTION_STATUS.QUEUED,
            data={},
        )

        try:
            # Execute the standalone node
            layer_results = [self._execute_single_node(start_node, 1)]

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

            self.end_event(data=execute_result)

            return execute_result

        except Exception as e:
            raise GraphExecutorError(f"Execution failed: {str(e)}.") from e
