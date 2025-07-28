import asyncio
from typing import Dict

from loguru import logger
from src.celery_worker.celery_worker import celery_app
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest


@celery_app.task
def compile_flow(flow_id: str, flow_graph_request_dict: Dict):
    flow_graph_request = FlowGraphRequest(**flow_graph_request_dict)
    G = GraphLoader.from_request(flow_graph_request)

    compiler = GraphCompiler(graph=G)
    compiler.compile()

    return {"status": "compiled", "flow_id": flow_id}


@celery_app.task
def run_flow(flow_id: str, flow_graph_request_dict: Dict, need_compile: bool = True):
    """
    Synchronous Celery task that runs async graph execution.

    Args:
        self: Celery task instance (when bind=True)
        flow_id: Unique identifier for the flow
        flow_graph_request_dict: Serialized flow graph request
        need_compile: Whether to compile the graph

    Returns:
        Dictionary with execution results
    """
    try:
        logger.info(f"Starting flow execution task for flow_id: {flow_id}")

        # Parse the request
        flow_graph_request = FlowGraphRequest(**flow_graph_request_dict)

        # Load the graph
        logger.info("Loading graph from request")
        G = GraphLoader.from_request(flow_graph_request)

        # Compile execution plan
        logger.info("Compiling execution plan")
        compiler = GraphCompiler(
            graph=G, remove_standalone=False
        )  # Keep standalone nodes
        execution_plan = compiler.compile()

        # Create executor
        logger.info(f"Creating executor with {len(execution_plan)} layers")
        executor = GraphExecutor(graph=G, execution_plan=execution_plan)

        # Run the async execution in a new event loop
        logger.info("Starting graph execution")

        # Create a new event loop for this thread
        try:
            # Try to get the current loop (will fail in worker thread)
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, we need to use a different approach
                loop = None
        except RuntimeError:
            loop = None

        if loop is None or loop.is_running():
            # Create a new event loop for the worker thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                # Run the async execution
                execution_result = loop.run_until_complete(executor.execute())
                logger.success(
                    f"Flow execution completed successfully for flow_id: {flow_id}"
                )

                return {
                    "status": "executed",
                    "flow_id": flow_id,
                    "execution_stats": execution_result,
                }

            finally:
                # Clean up the event loop
                loop.close()
        else:
            # Use the existing loop
            execution_result = loop.run_until_complete(executor.execute())
            logger.success(
                f"Flow execution completed successfully for flow_id: {flow_id}"
            )

            return {
                "status": "executed",
                "flow_id": flow_id,
                "execution_stats": execution_result,
            }

    except Exception as e:
        logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
        # Re-raise the exception so Celery marks the task as failed
        raise
