from typing import Dict, Optional
from uuid import uuid4

from fastapi import HTTPException
from loguru import logger
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.executors.ExecutionContext import ExecutionContext
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import (
    ApiFlowRunRequest,
    CanvasFlowRunRequest,
)
from src.schemas.flows.flow_schemas import FlowRunResult
from src.services.ApiKeyService import ApiKeyService
from src.services.FlowService import FlowService


class FlowSyncWorker:
    def __init__(self):
        self.run_id = str(uuid4())

    def run_sync(
        self,
        flow_id: str,
        session_id: str,
        flow_graph_request_dict: Dict,
        enable_debug: bool = True,
    ) -> FlowRunResult:
        try:
            logger.info(f"Starting flow execution task for flow_id: {flow_id}")

            # Parse the request
            flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)

            # Load the graph
            logger.info("Loading graph from request")
            G = GraphLoader.from_request(flow_graph_request)

            # Compile execution plan
            logger.info("Compiling execution plan")
            compiler = GraphCompiler(
                graph=G, remove_standalone=False
            )  # Keep standalone nodes
            execution_plan = compiler.compile()
            execution_context = ExecutionContext(
                run_id=self.run_id, flow_id=flow_id, session_id=session_id
            )
            logger.info(f"Creating executor with {len(execution_plan)} layers")
            executor = GraphExecutor(
                graph=G,
                execution_plan=execution_plan,
                execution_event_publisher=None,
                execution_context=execution_context,
                enable_debug=False,
            )

            # Run the SYNCHRONOUS execution - NO asyncio needed
            logger.info("Starting graph execution")

            # Since executor.execute() is now synchronous, call it directly
            execution_result = executor.execute()

            logger.success(
                f"Flow execution completed successfully for flow_id: {flow_id}"
            )

            # Parse execution result into FlowRunResult
            flow_run_result = FlowRunResult(**execution_result)
            return flow_run_result

        except Exception as e:
            logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
            # Re-raise the exception so Celery marks the task as failed
            raise

    def run_flow_with_validation(
        self,
        flow_id: str,
        flow_run_request: ApiFlowRunRequest,
        request_api_key: Optional[str],
        api_key_service: ApiKeyService,
        flow_service: FlowService,
        stream: bool = False,
    ) -> FlowRunResult:
        """
        Complete flow execution with validation and error handling.
        This method handles API key validation, flow retrieval, and execution.
        """
        try:
            # Validate API key
            if not request_api_key:
                logger.warning("No API key provided")
                raise UNAUTHORIZED_EXCEPTION

            api_key_model = api_key_service.validate_key(request_api_key)
            if not api_key_model:
                logger.warning("Invalid API key provided")
                raise UNAUTHORIZED_EXCEPTION

            # Check if streaming is requested (not supported yet)
            if stream:
                logger.warning("Flow streaming is not supported yet")
                raise HTTPException(
                    status_code=400,
                    detail="Flow run is not support right now.",
                )

            # Get flow definition from database
            logger.info(f"Retrieving flow definition for flow_id: {flow_id}")
            flow = flow_service.get_flow_detail_by_id(flow_id=flow_id)
            if not flow:
                logger.warning(f"Flow not found: {flow_id}")
                raise HTTPException(status_code=404, detail="Flow not found")

            # Check if flow is active (currently commented out in original)
            # if not flow.is_active:
            #     logger.warning(f"Flow is not active: {flow_id}")
            #     raise HTTPException(status_code=400, detail="Flow is not active")

            flow_definition = flow.flow_definition
            if not flow_definition:
                logger.warning(f"Flow has no definition: {flow_id}")
                raise HTTPException(status_code=400, detail="Flow has no definition")

            session_id = flow_run_request.session_id

            # Execute the flow
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")
            execution_result = self.run_sync(
                flow_id=flow_id,
                session_id=session_id,
                flow_graph_request_dict=flow_definition,
            )

            logger.success(
                f"Flow execution completed successfully for flow_id: {flow_id}"
            )
            return execution_result

        except HTTPException:
            # Re-raise HTTP exceptions to maintain proper error responses
            raise
        except Exception as e:
            logger.error(
                f"Flow execution with validation failed for flow_id {flow_id}: {str(e)}"
            )
            # Re-raise the exception to maintain error handling
            raise
