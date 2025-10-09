import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict

from loguru import logger
from src.consts.node_consts import NODE_EXECUTION_STATUS
from src.exceptions.execution_exceptions import GraphExecutorError
from src.schemas.flowbuilder.flow_graph_schemas import (
    FlowChatOutputResult,
    FlowExecutionResult,
    NodeData,
)


class RunFullStrategy:
    """
    Strategy for executing the full graph from the beginning.

    This strategy processes nodes layer by layer, where all nodes in each layer
    are executed concurrently before proceeding to the next layer.
    """

    def __init__(self, graph_executor):
        """
        Initialize the RunFullStrategy.

        Args:
            graph_executor: The GraphExecutor instance that owns this strategy
        """
        self.graph_executor = graph_executor

    async def execute(self) -> FlowExecutionResult:  # noqa
        """
        Execute the full graph from the beginning.
        """
        start_time = time.time()
        total_nodes = sum(len(layer) for layer in self.graph_executor.execution_plan)
        completed_nodes = 0

        # Publish the queue event for all nodes in each layer
        # Except for the first layer because it will be executed immediately
        for layer_index, layer_nodes in enumerate(
            self.graph_executor.execution_plan, start=1
        ):
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
                for layer_index, layer_nodes in enumerate(
                    self.graph_executor.execution_plan, 1
                ):
                    # logger.info(
                    #     f"Executing layer {layer_index}/{len(self.graph_executor.execution_plan)} "
                    #     f"with {len(layer_nodes)} nodes: {layer_nodes}"
                    # )

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
                    self.graph_executor._update_all_successors(successful_nodes)

            total_time = time.time() - start_time

            logger.success(
                f"Graph execution completed successfully in {total_time:.3f}s. "
                f"Processed {completed_nodes} nodes across {len(self.graph_executor.execution_plan)} layers."  # noqa: E501
            )

            # Collect results from the final layer
            final_layer_results = []
            chat_output_node_data = FlowChatOutputResult(content=None)
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

            # Loop through final layer results to collect chat output
            for result in final_layer_results:
                if result["data"]:
                    node_data: NodeData = NodeData.model_validate(result["data"])
                    if node_data.node_type == "Chat Output":
                        chat_output_node_data.content = node_data.input_values[
                            "message_in"
                        ]
                        break

            execute_result = FlowExecutionResult.model_validate(
                {
                    "success": True,
                    "total_nodes": total_nodes,
                    "completed_nodes": completed_nodes,
                    "total_layers": len(self.graph_executor.execution_plan),
                    "execution_time": total_time,
                    "results": final_layer_results,
                    "chat_output": chat_output_node_data.model_dump(),
                    "ancestors": [],
                }
            )

            # logger.info(f"👉 execute_result: {execute_result}")

            self.graph_executor.end_event(data=execute_result.model_dump())

            return execute_result

        except Exception as e:
            raise GraphExecutorError(f"Execution failed: {str(e)}.") from e
