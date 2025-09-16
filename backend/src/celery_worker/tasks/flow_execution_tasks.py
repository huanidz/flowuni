from typing import Dict

from loguru import logger
from redis import Redis
from src.celery_worker.celery_worker import celery_app
from src.configs.config import get_settings
from src.executors.ExecutionContext import ExecutionContext
from src.executors.ExecutionEventPublisher import (
    ExecutionControl,
    ExecutionEventPublisher,
)
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


@celery_app.task(bind=True)
def run_flow(
    self, flow_id: str, flow_graph_request_dict: Dict, enable_debug: bool = True
):
    """
    Synchronous Celery task that runs graph execution.

    Args:
        flow_id: Unique identifier for the flow
        flow_graph_request_dict: Serialized flow graph request

    Returns:
        Dictionary with execution results
    """
    try:
        app_settings = get_settings()

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
        redis_client = Redis(
            host=app_settings.REDIS_HOST,
            port=app_settings.REDIS_PORT,
            db=app_settings.REDIS_DB,
            decode_responses=True,
        )
        exe_event_publisher = ExecutionEventPublisher(
            task_id=self.request.id,
            redis_client=redis_client,
        )
        execution_context = ExecutionContext(
            run_id=self.request.id,
            flow_id=flow_id,
            session_id=flow_graph_request.session_id,
            user_id=None,
            metadata={},
        )
        exe_control = ExecutionControl(
            start_node=flow_graph_request.start_node, scope=flow_graph_request.scope
        )
        logger.info(f"Creating executor with {len(execution_plan)} layers")
        executor = GraphExecutor(
            graph=G,
            execution_plan=execution_plan,
            execution_event_publisher=exe_event_publisher,
            execution_context=execution_context,
            execution_control=exe_control,
            enable_debug=enable_debug,
        )

        # Run the SYNCHRONOUS execution - NO asyncio needed
        logger.info("Starting graph execution")

        # Since executor.execute() is now synchronous, call it directly
        execution_result = executor.execute()

        logger.success(f"Flow execution completed successfully for flow_id: {flow_id}")

        return {
            "status": "executed",
            "flow_id": flow_id,
            "execution_stats": execution_result,
        }

    except Exception as e:
        logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
        # Re-raise the exception so Celery marks the task as failed
        raise
