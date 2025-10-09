from typing import Dict, List, Optional

from fastapi import HTTPException
from loguru import logger
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.executors.ExecutionContext import ExecutionContext
from src.executors.ExecutionEventPublisher import (
    ExecutionControl,
)
from src.executors.GraphExecutor import GraphExecutor
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import (
    ApiFlowRunMessage,
    ApiFlowRunRequest,
    CanvasFlowRunRequest,
    FlowExecutionResult,
)
from src.schemas.flows.flow_schemas import FlowRunResult
from src.services.ApiKeyService import ApiKeyService
from src.services.FlowService import FlowService


class FlowAsyncWorker:
    """Synchronous flow execution worker for handling flow runs."""

    def __init__(self, user_id: Optional[int] = None, task_id: str = ""):
        self.user_id = user_id
        self.task_id = task_id

    async def run_async(
        self,
        flow_id: str,
        flow_run_request: ApiFlowRunRequest,
        session_id: Optional[str],
        flow_graph_request_dict: Dict,
        enable_debug: bool = True,
    ) -> FlowExecutionResult:
        """
        Execute a flow synchronously.

        Args:
            flow_id: Unique identifier for the flow
            session_id: Session identifier for execution context
            flow_graph_request_dict: Flow graph configuration dictionary
            enable_debug: Whether to enable debug mode (currently unused)
            is_test: Whether this is a test run

        Returns:
            FlowExecutionResult: Result of the flow execution

        Raises:
            Exception: Re-raises any execution errors for proper error handling
        """
        try:
            user_inputs: Optional[List[ApiFlowRunMessage]] = flow_run_request.messages

            text_input = None
            if user_inputs:
                text_input = "\n\n".join(
                    [
                        message.content
                        for message in user_inputs
                        if message.type == "text"
                    ]
                )

            logger.info(f"Starting flow execution for flow_id: {flow_id}")

            # Parse and load the flow graph
            flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
            graph = GraphLoader.from_request(
                flow_graph_request, custom_input_text=text_input
            )

            # Compile execution plan
            compiler = GraphCompiler(graph=graph, remove_standalone=False)
            execution_plan = await compiler.async_compile()

            # Set up execution context
            execution_context = ExecutionContext(
                run_id=self.task_id, flow_id=flow_id, session_id=session_id
            )

            exec_control = ExecutionControl(start_node=None, scope="downstream")

            # Create and run executor
            logger.info(f"Creating executor with {len(execution_plan)} layers")
            executor = GraphExecutor(
                graph=graph,
                execution_plan=execution_plan,
                execution_control=exec_control,
                execution_event_publisher=None,
                execution_context=execution_context,
                enable_debug=enable_debug,
            )

            logger.info("Starting graph execution")
            execution_result = executor.execute()

            logger.success(f"Flow execution completed for flow_id: {flow_id}")

            return execution_result

        except Exception as e:
            logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
            raise

    def run_flow_from_api(
        self,
        flow_id: str,
        flow_run_request: ApiFlowRunRequest,
        request_api_key: Optional[str],
        api_key_service: ApiKeyService,
        flow_service: FlowService,
        stream: bool = False,
        is_test: bool = False,
    ) -> FlowRunResult:
        """
        Execute a flow with complete validation and error handling.

        This method handles API key validation, flow retrieval, and execution
        in a single coordinated operation.

        Args:
            flow_id: Unique identifier for the flow
            flow_run_request: API request containing flow run parameters
            request_api_key: API key for authentication
            api_key_service: Service for API key operations
            flow_service: Service for flow operations
            stream: Whether to stream results (not currently supported)
            is_test: Whether this is a test run

        Returns:
            FlowRunResult: Result of the flow execution

        Raises:
            HTTPException: For HTTP-specific errors (401, 400, 404, 409)
            Exception: Re-raises other execution errors
        """
        try:
            # Validate API key
            self._validate_api_key(request_api_key, api_key_service)

            # Check streaming support
            if stream:
                logger.warning("Flow streaming requested but not supported")
                raise HTTPException(
                    status_code=400, detail="Flow streaming is not supported yet."
                )

            # Retrieve and validate flow
            flow_definition = self._get_validated_flow(flow_id, flow_service)

            # Execute the flow
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")
            result = self.run_sync(
                flow_id=flow_id,
                flow_run_request=flow_run_request,
                session_id=flow_run_request.session_id,
                flow_graph_request_dict=flow_definition,
                enable_debug=False,
            )

            logger.success(f"Validated flow execution completed for flow_id: {flow_id}")
            return result

        except HTTPException:
            raise  # Preserve HTTP exceptions for proper API responses
        except Exception as e:
            logger.error(
                f"Flow execution with validation failed for flow_id {flow_id}: {str(e)}"
            )
            raise

    def _validate_api_key(
        self, api_key: Optional[str], api_key_service: ApiKeyService
    ) -> None:
        """
        Validate the provided API key.

        Args:
            api_key: The API key to validate
            api_key_service: Service for API key operations

        Raises:
            HTTPException: If API key is missing or invalid (401)
        """
        if not api_key:
            logger.warning("No API key provided")
            raise UNAUTHORIZED_EXCEPTION

        api_key_model = api_key_service.validate_key(api_key)
        if not api_key_model:
            logger.warning("Invalid API key provided")
            raise UNAUTHORIZED_EXCEPTION

        # Update last used timestamp
        api_key_service.set_last_used_at(api_key_model.key_id)

    def _get_validated_flow(self, flow_id: str, flow_service: FlowService) -> Dict:
        """
        Retrieve and validate flow from the database.

        Args:
            flow_id: Unique identifier for the flow
            flow_service: Service for flow operations

        Returns:
            Dict: Flow definition dictionary

        Raises:
            HTTPException: If flow is not found (404), not activated (409),
                          or has no definition (400)
        """
        logger.info(f"Retrieving flow definition for flow_id: {flow_id}")
        flow = flow_service.get_flow_detail_by_id(flow_id=flow_id)

        if not flow:
            logger.warning(f"Flow not found: {flow_id}")
            raise HTTPException(status_code=404, detail="Flow not found")

        if not flow.is_active:
            logger.warning(f"Flow is not activated: {flow_id}")
            raise HTTPException(status_code=409, detail="Flow is not activated")

        if not flow.flow_definition:
            logger.warning(f"Flow has no definition: {flow_id}")
            raise HTTPException(status_code=400, detail="Flow has no definition")

        return flow.flow_definition
