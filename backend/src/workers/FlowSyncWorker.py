from typing import Dict

from loguru import logger
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import FlowGraphRequest


class FlowSyncWorker:
    def __init__(self):
        pass

    def run_sync(
        self, flow_id: str, flow_graph_request_dict: Dict, enable_debug: bool = True
    ):
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

            logger.info(f"Creating executor with {len(execution_plan)} layers")
            executor = GraphExecutor(
                graph=G,
                execution_plan=execution_plan,
                execution_context=None,
                enable_debug=False,
            )

            # Run the SYNCHRONOUS execution - NO asyncio needed
            logger.info("Starting graph execution")

            # Since executor.execute() is now synchronous, call it directly
            execution_result = executor.execute()

            logger.success(
                f"Flow execution completed successfully for flow_id: {flow_id}"
            )

            return execution_result

        except Exception as e:
            logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
            # Re-raise the exception so Celery marks the task as failed
            raise
