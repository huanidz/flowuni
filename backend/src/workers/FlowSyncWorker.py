# Refactored Code
from typing import Dict, Optional
from uuid import uuid4

from fastapi import HTTPException
from loguru import logger
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.executors.ExecutionContext import ExecutionContext
from src.executors.ExecutionEventPublisher import ExecutionEventPublisher
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import (
    ApiFlowRunRequest,
    CanvasFlowRunRequest,
)
from src.schemas.flows.flow_schemas import Flow, FlowRunResult
from src.services.ApiKeyService import ApiKeyService
from src.services.FlowService import FlowService


class FlowSyncWorker:
    """
    A worker class responsible for the synchronous execution of flows.
    """

    def run_sync(
        self,
        flow_id: str,
        session_id: str,
        graph_definition: Dict,
        enable_debug: bool = True,
        is_test: bool = False,
    ) -> FlowRunResult:
        """
        Executes a flow graph synchronously.

        This is the core execution engine that compiles and runs a graph.
        """
        # CHANGE: run_id is now generated per-run, not per-worker instance.
        run_id = str(uuid4())
        logger.info(f"Starting sync flow run: {run_id} for flow_id: {flow_id}")

        try:
            # 1. Load and Compile Graph
            flow_graph_request = CanvasFlowRunRequest(**graph_definition)
            graph = GraphLoader.from_request(flow_graph_request)
            compiler = GraphCompiler(graph=graph, remove_standalone=False)
            execution_plan = compiler.compile()

            # 2. Setup Execution Context
            execution_context = ExecutionContext(
                run_id=run_id, flow_id=flow_id, session_id=session_id
            )
            event_publisher = ExecutionEventPublisher() if is_test else None

            # 3. Execute Graph
            logger.info(f"Executing {len(execution_plan)} layers for run_id: {run_id}")
            executor = GraphExecutor(
                graph=graph,
                execution_plan=execution_plan,
                execution_event_publisher=event_publisher,
                execution_context=execution_context,
                # CHANGE: The enable_debug parameter is now correctly used.
                enable_debug=enable_debug,
            )
            execution_result = executor.execute()

            logger.success(f"Flow run {run_id} completed successfully.")
            return FlowRunResult(**execution_result)

        except Exception as e:
            logger.error(f"Flow run {run_id} failed for flow_id {flow_id}: {e}")
            raise  # Re-raise to be handled by the caller

    def run_flow_with_validation(
        self,
        flow_id: str,
        flow_run_request: ApiFlowRunRequest,
        request_api_key: Optional[str],
        api_key_service: ApiKeyService,
        flow_service: FlowService,
        is_test: bool = False,
    ) -> FlowRunResult:
        """
        Handles the complete, validated execution of a flow via an API request.
        """
        try:
            # 1. Validate API Key
            self._validate_api_key(request_api_key, api_key_service)

            # 2. Fetch and Validate Flow
            flow_definition = self._fetch_and_validate_flow(flow_id, flow_service)

            # 3. Execute the Flow
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")
            return self.run_sync(
                flow_id=flow_id,
                session_id=flow_run_request.session_id,
                graph_definition=flow_definition,
                is_test=is_test,
            )
        # CHANGE: Re-raising HTTPException directly avoids redundant handling.
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Unhandled exception during validated flow run for {flow_id}: {e}"
            )
            # CHANGE: Raise a generic server error for unexpected issues.
            raise HTTPException(status_code=500, detail="An internal error occurred.")

    def _validate_api_key(self, api_key: Optional[str], api_key_service: ApiKeyService):
        """Validates the provided API key and updates its last-used timestamp."""
        if not api_key:
            logger.warning("API key not provided.")
            raise UNAUTHORIZED_EXCEPTION

        api_key_model = api_key_service.validate_key(api_key)
        if not api_key_model:
            logger.warning("Invalid API key provided.")
            raise UNAUTHORIZED_EXCEPTION

        api_key_service.set_last_used_at(api_key_model.key_id)
        logger.info("API key validated successfully.")

    def _fetch_and_validate_flow(self, flow_id: str, flow_service: FlowService) -> Dict:
        """Retrieves a flow from the database and validates its state."""
        logger.info(f"Retrieving flow definition for flow_id: {flow_id}")
        flow: Optional[Flow] = flow_service.get_flow_detail_by_id(flow_id=flow_id)

        if not flow:
            logger.warning(f"Flow not found: {flow_id}")
            raise HTTPException(status_code=404, detail="Flow not found")

        if not flow.is_activate:
            logger.warning(f"Flow is not active: {flow_id}")
            raise HTTPException(status_code=409, detail="Flow is not activated")

        if not flow.flow_definition:
            logger.warning(f"Flow has no definition: {flow_id}")
            raise HTTPException(status_code=400, detail="Flow has no definition")

        return flow.flow_definition
