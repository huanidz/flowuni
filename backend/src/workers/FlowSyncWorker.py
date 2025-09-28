from datetime import datetime
from time import perf_counter
from typing import Dict, List, Optional, Tuple

import networkx as nx
from fastapi import HTTPException
from loguru import logger
from src.dependencies.redis_dependency import get_redis_client
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.exceptions.execution_exceptions import NotEnoughUserInformation
from src.exceptions.graph_exceptions import GraphCompilerError
from src.executors.ExecutionContext import ExecutionContext
from src.executors.ExecutionEventPublisher import (
    ExecutionControl,
    ExecutionEventPublisher,
)
from src.executors.GraphExecutor import GraphExecutor
from src.models.alchemy.flows.FlowTestCaseRunModel import TestCaseRunStatus
from src.models.validators.PassCriteriaRunnerModels import (
    CheckResult,
    RunnerResult,
    StepDetail,
)
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.schemas.flowbuilder.flow_graph_schemas import (
    ApiFlowRunRequest,
    CanvasFlowRunRequest,
    FlowExecutionResult,
)
from src.schemas.flows.flow_schemas import FlowRunResult
from src.services.ApiKeyService import ApiKeyService
from src.services.FlowService import FlowService
from src.services.FlowTestService import FlowTestService
from src.workers.PassCriteriaRunner import PassCriteriaRunner


class FlowSyncWorker:
    """Synchronous flow execution worker for handling flow runs."""

    def __init__(self, user_id: Optional[int] = None, task_id: str = ""):
        self.user_id = user_id
        self.task_id = task_id

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
        flow_test_service: Optional["FlowTestService"] = None,
    ) -> None:
        """
        Run a flow test synchronously.

        Steps:
            1. Load test case and mark as QUEUED.
            2. Compile the flow graph.
            3. Execute the flow.
            4. Save result and run pass criteria.
            5. Update status and publish events.
        """
        redis_client = get_redis_client()
        event_publisher = ExecutionEventPublisher(
            user_id=self.user_id,
            task_id=self.task_id,
            redis_client=redis_client,
            is_test=True,
        )

        # Load test case and mark QUEUED
        test_case = flow_test_service.get_test_case_by_id(case_id)
        pass_criteria: str = test_case.pass_criteria
        input_text: str = test_case.input_text
        self._mark_queued(flow_test_service, event_publisher, case_id)

        start_time: float = perf_counter()

        # Compile flow graph
        graph, execution_plan = self._compile_execution_plan(
            flow_graph_request_dict, input_text
        )

        try:
            # Execute flow
            execution_result: FlowExecutionResult = self._execute_flow(
                graph,
                execution_plan,
                flow_id,
                session_id,
                flow_test_service,
                event_publisher,
                case_id,
            )

            # Save result
            execution_time_ms: float = (perf_counter() - start_time) / 1000
            flow_test_service.update_test_case_run(
                run_id=self.task_id,
                status=TestCaseRunStatus.PASSED,
                finished_at=datetime.now(),
                execution_time_ms=execution_time_ms,
                actual_output=execution_result.model_dump(),
            )

            # Run pass criteria
            self._run_pass_criteria(
                pass_criteria,
                execution_result,
                flow_test_service,
                event_publisher,
                case_id,
            )

            logger.success(
                f"(TEST RUN) Flow execution completed for flow_id: {flow_id}"
            )

        except GraphCompilerError as e:
            self._mark_failed(flow_test_service, event_publisher, case_id)
            logger.error(
                f"(TEST RUN) Flow compilation failed for flow_id {flow_id}: {e}"
            )

        except Exception as e:
            flow_test_service.update_test_case_run(
                run_id=self.task_id,
                status=TestCaseRunStatus.SYSTEM_ERROR,
                error_message=str(e),
                finished_at=datetime.now(),
            )
            self._publish_event(
                flow_test_service,
                event_publisher,
                case_id,
                TestCaseRunStatus.SYSTEM_ERROR,
            )
            logger.error(f"(TEST RUN) Flow execution failed for flow_id {flow_id}: {e}")
            raise

    def run_flow_test(
        self,
        flow_id: str,
        case_id: int,
        flow_service: FlowService,
        flow_test_service: FlowTestService,
        session_id: Optional[str] = None,
    ) -> None:
        try:
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")

            # Retrieve and validate flow
            flow_definition = self._get_validated_flow(flow_id, flow_service)

            # Execute the flow
            self.run_test_sync(
                case_id=case_id,
                flow_id=flow_id,
                flow_graph_request_dict=flow_definition,
                session_id=session_id,
                flow_test_service=flow_test_service,
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

    # --- FOR TEST SYNC FLOW ---

    def _mark_queued(
        self,
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
    ) -> None:
        """Mark run as QUEUED and publish event."""
        service.update_test_case_run(
            run_id=self.task_id,
            status=TestCaseRunStatus.QUEUED,
            started_at=datetime.now(),
        )
        self._publish_event(service, publisher, case_id, TestCaseRunStatus.QUEUED)

    def _mark_failed(
        self,
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
    ) -> None:
        """Mark run as FAILED and publish event."""
        service.set_test_case_run_status(
            task_run_id=self.task_id, status=TestCaseRunStatus.FAILED
        )
        self._publish_event(service, publisher, case_id, TestCaseRunStatus.FAILED)

    def _publish_event(
        self,
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
        status: "TestCaseRunStatus",
    ) -> None:
        """Publish the latest run event with fresh test_run_data."""
        test_case_run = service.get_test_case_run_by_task_id(task_run_id=self.task_id)
        test_run_data: Dict = test_case_run.to_dict() if test_case_run else {}
        publisher.publish_test_run_event(
            case_id=case_id, status=status, test_run_data=test_run_data
        )

    def _compile_execution_plan(
        self, flow_graph_request_dict: Dict, input_text: str
    ) -> Tuple[nx.MultiDiGraph, List]:
        """Parse and compile the flow graph into an execution plan."""
        logger.info("(TEST RUN) Parsing and compiling flow graph")
        flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
        graph = GraphLoader.from_request(
            flow_graph_request, custom_input_text=input_text
        )
        compiler = GraphCompiler(graph=graph, remove_standalone=False)
        execution_plan: List[List[str]] = compiler.compile()
        return graph, execution_plan

    def _execute_flow(
        self,
        graph: nx.MultiDiGraph,
        execution_plan: List[List[str]],
        flow_id: str,
        session_id: Optional[str],
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
    ) -> "FlowExecutionResult":
        """Execute the compiled graph and return the execution result."""
        execution_context = ExecutionContext(
            run_id=self.task_id, flow_id=flow_id, session_id=session_id
        )
        execution_control = ExecutionControl(start_node=None, scope="downstream")

        logger.info(f"(TEST RUN) Creating executor with {len(execution_plan)} layers")
        executor = GraphExecutor(
            graph=graph,
            execution_plan=execution_plan,
            execution_event_publisher=publisher,
            execution_context=execution_context,
            execution_control=execution_control,
            enable_debug=False,
        )

        logger.info("(TEST RUN) Starting graph execution")
        service.set_test_case_run_status(
            task_run_id=self.task_id, status=TestCaseRunStatus.RUNNING
        )
        self._publish_event(service, publisher, case_id, TestCaseRunStatus.RUNNING)

        return executor.execute()

    def _run_pass_criteria(
        self,
        pass_criteria: str,
        execution_result: "FlowExecutionResult",
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
    ) -> None:
        """Evaluate pass criteria and update status accordingly."""
        criteria_runner = PassCriteriaRunner(flow_output=execution_result.chat_output)
        criteria_runner.load(pass_criteria)
        runner_result: "RunnerResult" = criteria_runner.run()

        status: TestCaseRunStatus = (
            TestCaseRunStatus.PASSED
            if runner_result.passed
            else TestCaseRunStatus.FAILED
        )
        service.set_test_case_run_status(task_run_id=self.task_id, status=status)
        self._publish_event(service, publisher, case_id, status)
