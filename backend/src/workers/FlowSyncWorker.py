from typing import Dict, Optional

from fastapi import HTTPException
from loguru import logger
from src.dependencies.redis_dependency import get_redis_client
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.exceptions.graph_exceptions import GraphCompilerError
from src.executors.ExecutionContext import ExecutionContext
from src.executors.ExecutionEventPublisher import (
    ExecutionControl,
    ExecutionEventPublisher,
)
from src.executors.GraphExecutor import GraphExecutor
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.models.events.RedisEvents import (
    RedisFlowTestRunEvent,
    RedisFlowTestRunEventPayload,
)
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
    """Synchronous flow execution worker for handling flow runs."""

    def __init__(self, task_id: str = ""):
        self.task_id = task_id

    def event_shoot(self, case_id: int):
        redis_client = get_redis_client()
        event_publisher = ExecutionEventPublisher(
            task_id=self.task_id, redis_client=redis_client, is_test=True
        )

        test_run_dummy_event = RedisFlowTestRunEvent(
            seq=event_publisher.seq,
            task_id=self.task_id,
            payload=RedisFlowTestRunEventPayload(case_id=case_id, status="PASSED"),
        )

        event_publisher.publish_test_run_event(
            stream_name=None, test_run_event=test_run_dummy_event
        )

        return

    def run_sync(
        self,
        flow_id: str,
        session_id: Optional[str],
        flow_graph_request_dict: Dict,
        enable_debug: bool = True,
    ) -> FlowRunResult:
        """
        Execute a flow synchronously.

        Args:
            flow_id: Unique identifier for the flow
            session_id: Session identifier for execution context
            flow_graph_request_dict: Flow graph configuration dictionary
            enable_debug: Whether to enable debug mode (currently unused)
            is_test: Whether this is a test run

        Returns:
            FlowRunResult: Result of the flow execution

        Raises:
            Exception: Re-raises any execution errors for proper error handling
        """
        try:
            logger.info(f"Starting flow execution for flow_id: {flow_id}")

            # Parse and load the flow graph
            flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
            graph = GraphLoader.from_request(flow_graph_request)

            # Compile execution plan
            compiler = GraphCompiler(graph=graph, remove_standalone=False)
            execution_plan = compiler.compile()

            # Set up execution context
            execution_context = ExecutionContext(
                run_id=self.task_id, flow_id=flow_id, session_id=session_id
            )

            # Create and run executor
            logger.info(f"Creating executor with {len(execution_plan)} layers")
            executor = GraphExecutor(
                graph=graph,
                execution_plan=execution_plan,
                execution_event_publisher=None,
                execution_context=execution_context,
                enable_debug=False,
            )

            logger.info("Starting graph execution")
            execution_result = executor.execute()

            logger.success(f"Flow execution completed for flow_id: {flow_id}")

            return FlowRunResult(**execution_result)

        except Exception as e:
            logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
            raise

    def run_test_sync(
        self,
        case_id: int,
        flow_id: str,
        flow_graph_request_dict: Dict,
        session_id: Optional[str] = None,
    ) -> FlowRunResult:
        try:
            """
            class TestCaseRunStatus(str, Enum):
                PENDING = "PENDING"
                QUEUED = "QUEUED"
                RUNNING = "RUNNING"
                PASSED = "PASSED"
                FAILED = "FAILED"
                CANCELLED = "CANCELLED"
                SYSTEM_ERROR = "SYSTEM_ERROR
            """
            redis_client = get_redis_client()
            event_publisher = ExecutionEventPublisher(
                task_id=self.task_id, redis_client=redis_client, is_test=True
            )
            event_publisher.publish_test_run_event(
                case_id=case_id, status=TestCaseRunStatus.QUEUED
            )

            # ===== TEST RUN START HERE =====

            logger.info(f"(TEST RUN) Starting flow execution for flow_id: {flow_id}")

            # Parse and load the flow graph
            flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
            graph = GraphLoader.from_request(flow_graph_request)

            # Compile execution plan
            compiler = GraphCompiler(graph=graph, remove_standalone=False)
            execution_plan = compiler.compile()

            # Set up execution context
            execution_context = ExecutionContext(
                run_id=self.task_id, flow_id=flow_id, session_id=session_id
            )
            execution_control = ExecutionControl(start_node=None, scope="downstream")

            # Create and run executor
            logger.info(
                f"(TEST RUN) Creating executor with {len(execution_plan)} layers"
            )
            executor = GraphExecutor(
                graph=graph,
                execution_plan=execution_plan,
                execution_event_publisher=event_publisher,
                execution_context=execution_context,
                execution_control=execution_control,
                enable_debug=False,
            )

            logger.info("(TEST RUN) Starting graph execution")
            execution_result = executor.execute()
            event_publisher.publish_test_run_event(
                case_id=case_id, status=TestCaseRunStatus.PASSED
            )

            logger.success(
                f"(TEST RUN) Flow execution completed for flow_id: {flow_id}"
            )

            return FlowRunResult(**execution_result)

        except GraphCompilerError as e:
            event_publisher.publish_test_run_event(
                case_id=case_id, status=TestCaseRunStatus.FAILED
            )
            logger.error(
                f"(TEST RUN) Flow compilation failed for flow_id {flow_id}: {str(e)}"
            )
            raise

        except Exception as e:
            event_publisher.publish_test_run_event(
                case_id=case_id, status=TestCaseRunStatus.FAILED
            )
            logger.error(
                f"(TEST RUN) Flow execution failed for flow_id {flow_id}: {str(e)}"
            )
            raise

    def run_flow_test(
        self,
        flow_id: str,
        case_id: int,
        flow_service: FlowService,
        session_id: Optional[str] = None,
    ) -> None:
        import time

        start_time = time.time()

        try:
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")

            # Retrieve and validate flow
            flow_start = time.time()
            flow_definition = self._get_validated_flow(flow_id, flow_service)
            flow_end = time.time()
            logger.info(
                f"Flow retrieval and validation took: {(flow_end - flow_start):.3f}s"
            )

            # Execute the flow
            execution_start = time.time()
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")
            self.run_test_sync(
                case_id=case_id,
                flow_id=flow_id,
                flow_graph_request_dict=flow_definition,
                session_id=session_id,
            )
            execution_end = time.time()
            logger.info(
                f"Flow execution took: {(execution_end - execution_start):.3f}s"
            )

            total_end = time.time()
            logger.info(
                f"Total flow test execution took: {(total_end - start_time):.3f}s"
            )
            logger.success(f"Validated flow execution completed for flow_id: {flow_id}")
            return

        except HTTPException:
            raise  # Preserve HTTP exceptions for proper API responses
        except Exception as e:
            logger.error(
                f"Flow execution with validation failed for flow_id {flow_id}: {str(e)}"
            )
            raise

    def run_flow_with_validation(
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
                session_id=flow_run_request.session_id,
                flow_graph_request_dict=flow_definition,
                is_test=is_test,
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
