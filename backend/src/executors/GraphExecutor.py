import json
import threading
import time
import traceback
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from typing import TYPE_CHECKING, Any, Dict, List, Optional

import networkx as nx
from loguru import logger
from src.consts.node_consts import (
    NODE_DATA_MODE,
    NODE_EXECUTION_STATUS,
    NODE_LABEL_CONSTS,
)
from src.exceptions.execution_exceptions import GraphExecutorError
from src.executors.DataClass import NodeExecutionResult
from src.executors.ExecutionEventPublisher import (
    ExecutionControl,
    ExecutionEventPublisher,
)
from src.executors.GraphExecutionUtil import GraphExecutionUtil
from src.executors.MultiDiGraphUtils import MultiDiGraphUtils
from src.executors.NodeDataFlowAdapter import NodeDataFlowAdapter
from src.executors.strategies.RunFromNodeStrategy import RunFromNodeStrategy
from src.executors.strategies.RunFullStrategy import RunFullStrategy
from src.nodes.core import NodeInput, NodeOutput

# Special imports
from src.nodes.handles.basics.outputs.RouterOutputHandle import RouterOutputData
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.flowbuilder.flow_graph_schemas import NodeData
from src.schemas.nodes.node_data_parsers import ToolDataParser

if TYPE_CHECKING:
    from src.executors.ExecutionContext import ExecutionContext


class GraphExecutor:
    """
    Executes a compiled graph with parallel execution within layers.

    This executor processes nodes layer by layer, where all nodes in each layer
    are executed concurrently before proceeding to the next layer.
    """

    def __init__(
        self,
        graph: nx.MultiDiGraph,
        execution_plan: List[List[str]],
        execution_control: ExecutionControl,
        max_workers: Optional[int] = None,
        enable_debug: bool = True,
        execution_context: Optional["ExecutionContext"] = None,
        execution_event_publisher: Optional[ExecutionEventPublisher] = None,
    ):
        """
        Initialize the GraphExecutor.

        Args:
            graph: The directed graph containing node specifications and data
            execution_plan: List of layers, where each layer contains nodes that can execute in parallel
            max_workers: Maximum number of threads for parallel execution
        """  # noqa: E501
        self.graph: nx.MultiDiGraph = graph
        self.execution_context: Optional["ExecutionContext"] = execution_context
        self.execution_plan: List[List[str]] = execution_plan
        self.execution_control: ExecutionControl = execution_control
        self.max_workers = max_workers

        # Flag and class for execution context
        self.enable_debug = enable_debug
        self.execution_event_publisher = execution_event_publisher

        # Thread safety for updating graph
        self._update_lock = threading.Lock()

        # Create node registry instance
        self._node_registry = NodeRegistry()

        # Initialize execution strategies
        self._run_full_strategy = RunFullStrategy(self)
        self._run_from_node_strategy = RunFromNodeStrategy(self)

    def push_event(self, node_id: str, event: str, data: Any = {}):
        # Publish node event to Redis
        if self.execution_event_publisher and self.enable_debug:
            self.execution_event_publisher.publish_node_event(
                node_id=node_id, event=event, data=data
            )

    def end_event(self, data: Dict = {}):
        # Publish DONE event to Redis
        if self.execution_event_publisher and self.enable_debug:
            self.execution_event_publisher.end(data=data)

    def execute(self) -> Dict[str, Any]:
        """
        Execute the graph with parallel processing within layers.

        This is the synchronous version that matches your old working code structure.
        Checks the execution control to determine if execution should start from a specific node.
        """

        # Check if we should start execution from a specific node
        if self.execution_control.start_node is not None:
            return self._run_from_node_strategy.execute(
                self.execution_control.start_node
            )

        # Otherwise, execute from the beginning
        return self._run_full_strategy.execute()

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
            if GraphExecutionUtil.validate_node_skip_status_before_execution(
                self.graph, node_id
            ):
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
                    node_data = GraphExecutionUtil.get_node_data_copy(
                        self.graph, node_id
                    )
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
            node_data = GraphExecutionUtil.prepare_node_data_for_execution(
                self.graph, node_id, node_data
            )

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
            executed_data: NodeData = node_instance.run(
                node_data=node_data, exec_context=self.execution_context
            )
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
                    # Get all edges between these nodes
                    edges_with_data = MultiDiGraphUtils.get_edges_with_data(
                        self.graph, node_id, successor_node_id
                    )

                    if not edges_with_data:
                        logger.warning(
                            f"No edge data between {node_id} and {successor_node_id}"
                        )
                        continue

                    # Process each edge
                    for edge_key, edge_data in edges_with_data:
                        successor_node_instance = self.graph.nodes.get(
                            successor_node_id
                        )
                        successor_node_data: NodeData = successor_node_instance.get(
                            "data"
                        )

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
                        logger.info(f"👉 source_handle: {source_handle}")
                        target_handle = edge_data.get("target_handle", "")
                        logger.info(f"👉 target_handle: {target_handle}")

                        # Handle the -index splitting (same as old version)
                        if source_handle and "-index" in source_handle:
                            source_handle = source_handle.split("-index")[0]
                        if target_handle and "-index" in target_handle:
                            target_handle = target_handle.split("-index")[0]

                        # Handle tool mode case using the dedicated function
                        if (source_handle is None) and (
                            SOURCE_MODE == NODE_DATA_MODE.TOOL
                        ):
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
                            edge_key,  # Pass edge key for router logic
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
        edge_key: str = None,  # Add edge_key parameter
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
            edge_key: The key of the edge (for MultiDiGraph)

        Raises:
            Exception: Re-raises any exception that occurs during the update process
        """

        try:
            current_node_label: str = executed_data.node_type

            # Get edge data using the utility function
            edge_data = MultiDiGraphUtils.get_edge_data_by_key(
                self.graph, node_id, successor_node_id, edge_key
            )

            if not edge_data:
                logger.warning(
                    f"No edge data between {node_id} and {successor_node_id} with key {edge_key}"
                )
                return

            edge_id = edge_data.get("id")
            logger.info(f"👉 edge_id: {edge_id}")

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

                # If the edge_id is not in the label decisons, then the exec_status of that succesor node will be set to SKIPPED. # noqa E501
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

            # Step 7: Handle assignment based on multiple incoming edges setting
            if input_handle_from_successor_node.allow_multiple_incoming_edges:
                # If multiple incoming edges are allowed, maintain a list
                existing_value = successor_node_data.input_values.get(target_handle)

                if existing_value is None:
                    # No existing value, create a new list with the current value
                    successor_node_data.input_values[target_handle] = [
                        adapted_output_value_to_transfer
                    ]
                elif isinstance(existing_value, list):
                    # Existing value is already a list, append to it
                    existing_value.append(adapted_output_value_to_transfer)
                else:
                    # Existing value is not a list, convert to list and append
                    successor_node_data.input_values[target_handle] = [
                        existing_value,
                        adapted_output_value_to_transfer,
                    ]
            else:
                # Multiple incoming edges not allowed, direct assignment
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
            tool_name = executed_data.output_values["tool_name"]
            tool_description = executed_data.output_values["tool_description"]

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
