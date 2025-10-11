from datetime import datetime
from time import perf_counter
from typing import Any, Dict, List, Optional, Tuple

import networkx as nx
from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.dependencies.db_dependency import AsyncNullPoolSessionLocal
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
from src.models.validators.PassCriteriaRunnerModels import (
    RunnerResult,
    StepDetail,
)
from src.nodes.GraphCompiler import GraphCompiler
from src.nodes.GraphLoader import GraphLoader
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.FlowTestRepository import FlowTestRepository
from src.schemas.flowbuilder.flow_graph_schemas import (
    ApiFlowRunMessage,
    ApiFlowRunRequest,
    CanvasFlowRunRequest,
    FlowExecutionResult,
)
from src.schemas.flows.flow_schemas import FlowRunResult
from src.services.ApiKeyService import ApiKeyService
from src.services.FlowService import FlowService
from src.services.FlowTestService import FlowTestService
from src.workers.PassCriteriaRunner import PassCriteriaRunner


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
            execution_result = await executor.execute()

            logger.success(f"Flow execution completed for flow_id: {flow_id}")

            return execution_result

        except Exception as e:
            logger.error(f"Flow execution failed for flow_id {flow_id}: {str(e)}")
            raise

    async def run_flow_from_api(
        self,
        flow_id: str,
        flow_run_request: ApiFlowRunRequest,
        request_api_key: Optional[str],
        api_key_service: ApiKeyService,
        flow_service: FlowService,
        session: AsyncSession,
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
            await self._validate_api_key(request_api_key, api_key_service, session)

            # Check streaming support
            if stream:
                logger.warning("Flow streaming requested but not supported")
                raise HTTPException(
                    status_code=400, detail="Flow streaming is not supported yet."
                )

            # Retrieve and validate flow
            flow_definition = await self._get_validated_flow(
                flow_id, flow_service, session
            )

            # Execute the flow
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")
            result = await self.run_async(
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

    async def _validate_api_key(
        self,
        api_key: Optional[str],
        api_key_service: ApiKeyService,
        session: AsyncSession,
    ) -> None:
        """
        Validate the provided API key.

        Args:
            api_key: The API key to validate
            api_key_service: Service for API key operations
            session: AsyncSession for database operations

        Raises:
            HTTPException: If API key is missing or invalid (401)
        """
        if not api_key:
            logger.warning("No API key provided")
            raise UNAUTHORIZED_EXCEPTION

        api_key_model = await api_key_service.validate_key(api_key, session)
        if not api_key_model:
            logger.warning("Invalid API key provided")
            raise UNAUTHORIZED_EXCEPTION

        # Update last used timestamp
        await api_key_service.set_last_used_at(api_key_model.key_id, session)

    async def _get_validated_flow(
        self, flow_id: str, flow_service: FlowService, session: AsyncSession
    ) -> Dict:
        """
        Retrieve and validate flow from the database.

        Args:
            flow_id: Unique identifier for the flow
            flow_service: Service for flow operations
            session: AsyncSession for database operations

        Returns:
            Dict: Flow definition dictionary

        Raises:
            HTTPException: If flow is not found (404), not activated (409),
                          or has no definition (400)
        """
        logger.info(f"Retrieving flow definition for flow_id: {flow_id}")
        flow = await flow_service.get_flow_detail_by_id(
            flow_id=flow_id, session=session
        )

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

    async def run_test_async(
        self,
        case_id: int,
        flow_id: str,
        flow_graph_request_dict: Dict,
        session_id: Optional[str] = None,
        flow_test_service: Optional["FlowTestService"] = None,
        session: Optional[AsyncSession] = None,
    ) -> None:
        """
        Run a flow test asynchronously.

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
        test_case = await flow_test_service.get_test_case_by_id(
            session=session, case_id=case_id
        )
        pass_criteria: Dict[str, Any] = test_case.pass_criteria
        input_text: str = test_case.input_text
        await self._mark_queued(
            service=flow_test_service,
            publisher=event_publisher,
            case_id=case_id,
            session=session,
        )

        start_time: float = perf_counter()

        if await self._is_cancelled(
            test_case_id=case_id, service=flow_test_service, session=session
        ):
            return

        # Compile flow graph
        graph, execution_plan = await self._compile_execution_plan(
            flow_graph_request_dict=flow_graph_request_dict, input_text=input_text
        )

        try:
            if await self._is_cancelled(
                test_case_id=case_id, service=flow_test_service, session=session
            ):
                return
            # Execute flow
            execution_result: FlowExecutionResult = await self._execute_flow(
                graph,
                execution_plan,
                flow_id,
                session_id,
                flow_test_service,
                event_publisher,
                case_id,
                session,
            )

            # Save result
            execution_time_ms: float = (perf_counter() - start_time) / 1000
            await flow_test_service.update_test_case_run(
                run_id=self.task_id,
                finished_at=datetime.now(),
                execution_time_ms=execution_time_ms,
                actual_output=execution_result.model_dump(),
                session=session,
            )

            if await self._is_cancelled(case_id, flow_test_service, session):
                return

            # Run pass criteria
            await self._run_pass_criteria(
                pass_criteria,
                execution_result,
                flow_test_service,
                event_publisher,
                case_id,
                session,
            )

            logger.success(
                f"(TEST RUN) Flow execution completed for flow_id: {flow_id}"
            )

        except GraphCompilerError as e:
            await self._mark_failed(
                flow_test_service, event_publisher, case_id, session
            )
            logger.error(
                f"(TEST RUN) Flow compilation failed for flow_id {flow_id}: {e}"
            )

        except Exception as e:
            await flow_test_service.update_test_case_run(
                run_id=self.task_id,
                status=TestCaseRunStatus.SYSTEM_ERROR,
                error_message=str(e),
                finished_at=datetime.now(),
                session=session,
            )
            await self._publish_event(
                flow_test_service,
                event_publisher,
                case_id,
                TestCaseRunStatus.SYSTEM_ERROR,
                session,
            )
            logger.error(f"(TEST RUN) Flow execution failed for flow_id {flow_id}: {e}")
            raise

    async def run_flow_test(
        self,
        flow_id: str,
        case_id: int,
        session_id: Optional[str] = None,
    ) -> None:
        try:
            logger.info(f"Starting validated flow execution for flow_id: {flow_id}")

            async with AsyncNullPoolSessionLocal() as session:
                flow_service = FlowService(flow_repository=FlowRepository())
                # Retrieve and validate flow
                flow_definition = await self._get_validated_flow(
                    flow_id, flow_service, session
                )

                flow_test_service = FlowTestService(
                    test_repository=FlowTestRepository(),
                    redis_client=get_redis_client(),
                )

                # Execute the flow
                await self.run_test_async(
                    case_id=case_id,
                    flow_id=flow_id,
                    flow_graph_request_dict=flow_definition,
                    session_id=session_id,
                    flow_test_service=flow_test_service,
                    session=session,
                )

                await session.commit()

            logger.success(f"Validated flow execution completed for flow_id: {flow_id}")
            return

        except HTTPException:
            raise  # Preserve HTTP exceptions for proper API responses
        except Exception as e:
            logger.error(
                f"Flow execution with validation failed for flow_id {flow_id}: {str(e)}"
            )
            raise

    # --- FOR TEST ASYNC FLOW ---

    async def _mark_queued(
        self,
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
        session: AsyncSession,
    ) -> None:
        """Mark run as QUEUED and publish event."""
        await service.update_test_case_run(
            run_id=self.task_id,
            status=TestCaseRunStatus.QUEUED,
            started_at=datetime.now(),
            session=session,
        )
        await self._publish_event(
            service, publisher, case_id, TestCaseRunStatus.QUEUED, session
        )

    async def _mark_failed(
        self,
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
        session: AsyncSession,
    ) -> None:
        """Mark run as FAILED and publish event."""
        await service.set_test_case_run_status(
            task_run_id=self.task_id, status=TestCaseRunStatus.FAILED, session=session
        )
        await self._publish_event(
            service, publisher, case_id, TestCaseRunStatus.FAILED, session
        )

    async def _publish_event(
        self,
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
        status: "TestCaseRunStatus",
        session: AsyncSession,
    ) -> None:
        """Publish the latest run event with fresh test_run_data."""
        test_case_run = await service.get_test_case_run_by_task_id(
            task_run_id=self.task_id, session=session
        )
        test_run_data: Dict = test_case_run.to_dict() if test_case_run else {}
        publisher.publish_test_run_event(
            case_id=case_id, status=status, test_run_data=test_run_data
        )

    async def _compile_execution_plan(
        self, flow_graph_request_dict: Dict, input_text: str
    ) -> Tuple[nx.MultiDiGraph, List]:
        """Parse and compile the flow graph into an execution plan."""
        logger.info("(TEST RUN) Parsing and compiling flow graph")
        flow_graph_request = CanvasFlowRunRequest(**flow_graph_request_dict)
        graph = GraphLoader.from_request(
            flow_graph_request, custom_input_text=input_text
        )
        compiler = GraphCompiler(graph=graph, remove_standalone=False)
        execution_plan: List[List[str]] = await compiler.async_compile()
        return graph, execution_plan

    async def _execute_flow(
        self,
        graph: nx.MultiDiGraph,
        execution_plan: List[List[str]],
        flow_id: str,
        session_id: Optional[str],
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
        session: AsyncSession,
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
        await service.set_test_case_run_status(
            task_run_id=self.task_id, status=TestCaseRunStatus.RUNNING, session=session
        )
        await self._publish_event(
            service, publisher, case_id, TestCaseRunStatus.RUNNING, session
        )

        return await executor.execute()

    async def _run_pass_criteria(
        self,
        pass_criteria: Dict[str, Any],
        execution_result: "FlowExecutionResult",
        service: "FlowTestService",
        publisher: "ExecutionEventPublisher",
        case_id: int,
        session: AsyncSession,
    ) -> None:
        """Evaluate pass criteria and update status accordingly."""
        criteria_runner = PassCriteriaRunner(
            flow_output=execution_result.chat_output.content
        )
        criteria_runner.load(pass_criteria)
        runner_result: "RunnerResult" = criteria_runner.run()

        failed_criteria: List[StepDetail] = runner_result.failed_items

        construct_error_msg: str = ""
        for item in failed_criteria:
            construct_error_msg += f"Criteria-{item.id}: {item.result.reason}\n"

        status: TestCaseRunStatus = (
            TestCaseRunStatus.PASSED
            if runner_result.passed
            else TestCaseRunStatus.FAILED
        )
        await service.update_test_case_run(
            run_id=self.task_id,
            status=status,
            error_message=construct_error_msg if failed_criteria else None,
            session=session,
        )
        publisher.publish_test_run_event(
            case_id=case_id,
            status=status,
            flow_exec_result=execution_result,
            test_run_data={},
            error_message=construct_error_msg if failed_criteria else None,
        )

    async def _is_cancelled(
        self, test_case_id: int, service: FlowTestService, session: AsyncSession
    ) -> bool:
        """Check if task was cancelled"""
        status = await service.get_latest_test_case_run_status(
            test_case_id=test_case_id, session=session
        )
        if status == TestCaseRunStatus.CANCELLED:
            logger.info(f"Test case {test_case_id} was cancelled, stopping execution")
            return True
        return False
