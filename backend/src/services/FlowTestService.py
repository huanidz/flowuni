import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException
from loguru import logger
from redis import Redis
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from src.configs.config import get_app_settings
from src.consts.cache_consts import CACHE_PREFIX
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
from src.helpers.CacheHelper import CacheHelper
from src.models.alchemy.flows.FlowTestCaseModel import FlowTestCaseModel
from src.models.alchemy.flows.FlowTestCaseRunModel import (
    FlowTestCaseRunModel,
    TestCaseRunStatus,
)
from src.models.alchemy.flows.FlowTestSuiteModel import FlowTestSuiteModel
from src.models.validators.PassCriteriaValidator import PassCriteriaValidator
from src.repositories.FlowTestRepository import FlowTestRepository


class FlowTestServiceInterface(ABC):
    """
    Flow test service interface
    """

    @abstractmethod
    async def create_test_suite(
        self,
        session: AsyncSession,
        flow_id: str,
        name: str,
        description: Optional[str] = None,
    ) -> FlowTestSuiteModel:
        """
        Create a new test suite for a flow
        """
        pass

    @abstractmethod
    async def delete_test_suite(self, session: AsyncSession, suite_id: int) -> None:
        """
        Delete a test suite by its ID
        """
        pass

    @abstractmethod
    async def update_test_suite(
        self,
        session: AsyncSession,
        suite_id: int,
        flow_id: Optional[str] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> FlowTestSuiteModel:
        """
        Update a test suite by its ID.

        Args:
            suite_id: Test suite ID to update
            flow_id: New flow ID (optional)
            name: New test suite name (optional)
            description: New test suite description (optional)
            is_active: New active status (optional)

        Returns:
            Updated test suite model
        """
        pass

    @abstractmethod
    async def get_test_suite_by_id(
        self, session: AsyncSession, suite_id: int
    ) -> Optional[FlowTestSuiteModel]:
        """
        Get a test suite by its ID
        """
        pass

    @abstractmethod
    async def get_test_suites_by_flow_id(
        self, session: AsyncSession, flow_id: str
    ) -> list[FlowTestSuiteModel]:
        """
        Get all test suites for a specific flow
        """
        pass

    @abstractmethod
    async def create_empty_test_case(
        self,
        session: AsyncSession,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new empty test case for a test suite
        """
        pass

    @abstractmethod
    async def get_test_case_by_id(
        self, session: AsyncSession, case_id: int
    ) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID
        """
        pass

    @abstractmethod
    async def delete_test_case(self, session: AsyncSession, case_id: int) -> None:
        """
        Delete a test case by its ID
        """
        pass

    @abstractmethod
    async def update_test_case(
        self,
        session: AsyncSession,
        case_id: int,
        suite_id: Optional[int] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
        input_text: Optional[str] = None,
        input_metadata: Optional[Dict[str, Any]] = None,
        pass_criteria: Optional[PassCriteriaValidator] = None,
        timeout_ms: Optional[float] = None,
    ) -> FlowTestCaseModel:
        """
        Update a test case by its ID.

        Args:
            case_id: Test case ID to update
            suite_id: New test suite ID (optional)
            name: New test case name (optional)
            description: New test case description (optional)
            is_active: New active status (optional)
            input_text: New input data (optional)
            input_metadata: New input metadata (optional)
            pass_criteria: New pass criteria (optional)
            timeout_ms: New timeout in milliseconds (optional)

        Returns:
            Updated test case model
        """
        pass

    @abstractmethod
    async def get_test_suites_with_case_previews(
        self, session: AsyncSession, flow_id: str
    ) -> list[dict]:
        """
        Get all test suites for a specific flow with test case previews
        """
        pass

    @abstractmethod
    async def queue_test_case_run(
        self, session: AsyncSession, test_case_id: int, task_run_id: str
    ) -> None:
        """
        Queue a test case for execution
        """
        pass

    @abstractmethod
    async def update_test_case_run(
        self,
        session: AsyncSession,
        run_id: str,
        status: Optional["TestCaseRunStatus"] = None,
        actual_output: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        execution_time_ms: Optional[float] = None,
        run_detail: Optional[Dict[str, Any]] = None,
        criteria_results: Optional[Dict[str, Any]] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
    ) -> "FlowTestCaseRunModel":
        """
        Update a test case run by its ID.

        Args:
            run_id: Test case run ID to update
            status: New run status (optional)
            actual_output: New actual output data (optional)
            error_message: New error message (optional)
            execution_time_ms: New execution time in milliseconds (optional)
            run_detail: New run detail data (optional)
            criteria_results: New criteria results (optional)
            started_at: New start time (optional)
            finished_at: New finish time (optional)

        Returns:
            Updated test case run model
        """
        pass

    @abstractmethod
    async def set_test_case_run_status(
        self, session: AsyncSession, task_run_id: str, status: str
    ) -> None:
        """
        Set the status of a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run
            status: The status to set for the test case run
        """
        pass

    @abstractmethod
    async def get_latest_test_case_run_status(
        self, session: AsyncSession, test_case_id: int
    ) -> str:
        """
        Get the status of the latest test case run for a given test case ID.

        Args:
            test_case_id: The ID of the test case

        Returns:
            str: The status of the latest test case run, or PENDING if no runs exist
        """
        pass

    @abstractmethod
    async def get_latest_test_cases_run_status(
        self, session: AsyncSession, test_case_ids: list[int]
    ) -> dict[int, str]:
        """
        Get the status of the latest test case run for multiple test case IDs.

        Args:
            test_case_ids: List of test case IDs

        Returns:
            dict[int, str]: Dictionary mapping test case IDs to their latest run status,
                           or PENDING if no runs exist for a test case
        """
        pass

    @abstractmethod
    async def get_test_case_pass_criteria(
        self, session: AsyncSession, test_case_id: int
    ) -> Optional[PassCriteriaValidator]:
        """
        Get the pass criteria for a specific test case.

        Args:
            test_case_id: The ID of the test case

        Returns:
            Optional[PassCriteriaValidator]: The pass criteria validator for the test case,
                                           or None if not found
        """
        pass

    @abstractmethod
    async def get_test_case_run_by_task_id(
        self, session: AsyncSession, task_run_id: str
    ) -> Optional[FlowTestCaseRunModel]:
        """
        Get a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run

        Returns:
            Optional[FlowTestCaseRunModel]: The test case run model, or None if not found
        """
        pass

    @abstractmethod
    async def cancel_test_case_run(
        self, session: AsyncSession, task_run_id: str
    ) -> bool:
        """
        Cancel a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run to cancel

        Returns:
            bool: True if the test was successfully cancelled, False otherwise
        """
        pass

    @abstractmethod
    async def cancel_test_case_runs(
        self, session: AsyncSession, task_run_ids: list[str]
    ) -> dict[str, bool]:
        """
        Cancel multiple test case runs by their task run IDs.

        Args:
            task_run_ids: List of task run IDs to cancel

        Returns:
            dict[str, bool]: Dictionary mapping task run IDs to their cancellation status
        """
        pass


class FlowTestService(FlowTestServiceInterface):
    """
    Flow test service implementation
    """

    def __init__(
        self,
        test_repository: Optional[FlowTestRepository] = None,
        redis_client: Optional[Redis] = None,
    ):
        self.test_repository = test_repository or FlowTestRepository()
        self.redis_client = redis_client
        self.cache_helper = CacheHelper(redis_client, ttl=3600)

    async def create_test_suite(
        self,
        session: AsyncSession,
        flow_id: str,
        name: str,
        description: Optional[str] = None,
    ) -> FlowTestSuiteModel:
        """
        Create a new test suite for a flow
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                test_suite = await self.test_repository.create_test_suite(
                    session=session,
                    flow_id=flow_id,
                    name=name,
                    description=description,
                )
                logger.info(
                    f"Successfully created test suite '{name}' for flow {flow_id}"
                )
                return test_suite
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Resource not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to create test suite: {str(e)}"
            )

    async def delete_test_suite(self, session: AsyncSession, suite_id: int) -> None:
        """
        Delete a test suite by its ID
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test suite exists
                test_suite = await self.test_repository.get_test_suite_by_id(
                    session=session, suite_id=suite_id
                )
                if not test_suite:
                    logger.warning(f"Test suite with ID {suite_id} not found")
                    raise NOT_FOUND_EXCEPTION

                await self.test_repository.delete_test_suite(
                    session=session, suite_id=suite_id
                )
                logger.info(f"Successfully deleted test suite with ID {suite_id}")
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test suite not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to delete test suite: {str(e)}"
            )

    async def update_test_suite(
        self,
        session: AsyncSession,
        suite_id: int,
        flow_id: Optional[str] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> FlowTestSuiteModel:
        """
        Update a test suite by its ID.

        Args:
            suite_id: Test suite ID to update
            flow_id: New flow ID (optional)
            name: New test suite name (optional)
            description: New test suite description (optional)
            is_active: New active status (optional)

        Returns:
            Updated test suite model
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test suite exists
                test_suite = await self.test_repository.get_test_suite_by_id(
                    session=session, suite_id=suite_id
                )
                if not test_suite:
                    logger.warning(f"Test suite with ID {suite_id} not found")
                    raise NOT_FOUND_EXCEPTION

                # Update the test suite
                updated_test_suite = await self.test_repository.update_test_suite(
                    session=session,
                    suite_id=suite_id,
                    flow_id=flow_id,
                    name=name,
                    description=description,
                    is_active=is_active,
                )
                logger.info(f"Successfully updated test suite with ID {suite_id}")
                return updated_test_suite
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test suite not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to update test suite: {str(e)}"
            )

    async def get_test_suite_by_id(
        self, session: AsyncSession, suite_id: int
    ) -> Optional[FlowTestSuiteModel]:
        """
        Get a test suite by its ID
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                test_suite = await self.test_repository.get_test_suite_by_id(
                    session=session, suite_id=suite_id
                )
                if test_suite:
                    logger.info(f"Successfully retrieved test suite with ID {suite_id}")
                else:
                    logger.info(f"Test suite with ID {suite_id} not found")
                return test_suite
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve test suite: {str(e)}"
            )

    async def get_test_suites_by_flow_id(
        self, session: AsyncSession, flow_id: str
    ) -> list[FlowTestSuiteModel]:
        """
        Get all test suites for a specific flow
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                test_suites = await self.test_repository.get_test_suites_by_flow_id(
                    session=session, flow_id=flow_id
                )
                logger.info(
                    f"Successfully retrieved {len(test_suites)} test suites for flow {flow_id}"  # noqa
                )
                return test_suites
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve test suites: {str(e)}"
            )

    async def get_test_case_by_id(
        self, session: AsyncSession, case_id: int
    ) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID
        """
        cache_key = f"{CACHE_PREFIX.TEST_CASE}:{case_id}"

        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Try to get from cache first
                cached_test_case = self.cache_helper.get(cache_key, FlowTestCaseModel)
                if cached_test_case:
                    logger.info(f"Retrieved test case with ID {case_id} from cache")
                    return cached_test_case

                # Get from database if not in cache
                test_case = await self.test_repository.get_test_case_by_id(
                    session=session, case_id=case_id
                )

                if test_case:
                    logger.info(
                        f"Successfully retrieved test case with ID {case_id} from database"
                    )

                    # Store in cache
                    test_case_dict = test_case.to_dict()
                    self.cache_helper.set(cache_key, test_case_dict)
                    logger.info(f"Cached test case with ID {case_id}")
                else:
                    logger.info(f"Test case with ID {case_id} not found in database")

                return test_case
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve test case: {str(e)}"
            )

    async def create_empty_test_case(
        self,
        session: AsyncSession,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new empty test case for a test suite
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test suite exists
                test_suite = await self.test_repository.get_test_suite_by_id(
                    session=session, suite_id=suite_id
                )
                if not test_suite:
                    logger.warning(f"Test suite with ID {suite_id} not found")
                    raise NOT_FOUND_EXCEPTION

                test_case = await self.test_repository.create_empty_test_case(
                    session=session, suite_id=suite_id, name=name, desc=desc
                )
                logger.info(
                    f"Successfully created empty test case '{name}' for suite {suite_id}"
                )
                return test_case
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test suite not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to create test case: {str(e)}"
            )

    async def delete_test_case(self, session: AsyncSession, case_id: int) -> None:
        """
        Delete a test case by its ID
        """
        cache_key = f"{CACHE_PREFIX.TEST_CASE}:{case_id}"

        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test case exists
                test_case = await self.test_repository.get_test_case_by_id(
                    session=session, case_id=case_id
                )
                if not test_case:
                    logger.warning(f"Test case with ID {case_id} not found")
                    raise NOT_FOUND_EXCEPTION

                await self.test_repository.delete_test_case(
                    session=session, case_id=case_id
                )
                logger.info(
                    f"Successfully deleted test case with ID {case_id} from database"
                )

                # Invalidate cache
                self.cache_helper.delete(cache_key)
                logger.info(f"Invalidated cache for test case with ID {case_id}")
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test case not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to delete test case: {str(e)}"
            )

    async def update_test_case(
        self,
        session: AsyncSession,
        case_id: int,
        suite_id: Optional[int] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
        input_text: Optional[str] = None,
        input_metadata: Optional[Dict[str, Any]] = None,
        pass_criteria: Optional[PassCriteriaValidator] = None,
        timeout_ms: Optional[float] = None,
    ) -> FlowTestCaseModel:
        """
        Update a test case by its ID.

        Args:
            case_id: Test case ID to update
            suite_id: New test suite ID (optional)
            name: New test case name (optional)
            description: New test case description (optional)
            is_active: New active status (optional)
            input_text: New input data (optional)
            input_metadata: New input metadata (optional)
            pass_criteria: New pass criteria (optional)
            timeout_ms: New timeout in milliseconds (optional)

        Returns:
            Updated test case model
        """
        cache_key = f"{CACHE_PREFIX.TEST_CASE}:{case_id}"

        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test case exists
                test_case = await self.test_repository.get_test_case_by_id(
                    session=session, case_id=case_id
                )
                if not test_case:
                    logger.warning(f"Test case with ID {case_id} not found")
                    raise NOT_FOUND_EXCEPTION

                # Update the test case
                updated_test_case = await self.test_repository.update_test_case(
                    session=session,
                    case_id=case_id,
                    suite_id=suite_id,
                    name=name,
                    description=description,
                    is_active=is_active,
                    input_text=input_text,
                    input_metadata=input_metadata,
                    pass_criteria=pass_criteria.model_dump() if pass_criteria else None,
                    timeout_ms=timeout_ms,
                )
                logger.info(f"Successfully updated test case with ID {case_id}")

                # Invalidate cache
                self.cache_helper.delete(cache_key)
                logger.info(f"Invalidated cache for test case with ID {case_id}")

                return updated_test_case
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test case not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to update test case: {str(e)}"
            )

    async def get_test_suites_with_case_previews(
        self, session: AsyncSession, flow_id: str
    ) -> list[dict]:
        """
        Get all test suites for a specific flow with test case previews
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                test_suites = (
                    await self.test_repository.get_test_suites_with_case_previews(
                        session=session, flow_id=flow_id
                    )
                )
                logger.info(
                    f"Successfully retrieved {len(test_suites)} test suites with case previews for flow {flow_id}"  # noqa
                )
                return test_suites
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve test suites: {str(e)}"
            )

    async def queue_test_case_run(
        self, session: AsyncSession, test_case_id: int, task_run_id: str
    ) -> None:
        """
        Queue a test case for execution
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test case exists
                test_case = await self.test_repository.get_test_case_by_id(
                    session=session, case_id=test_case_id
                )
                if not test_case:
                    logger.warning(f"Test case with ID {test_case_id} not found")
                    raise NOT_FOUND_EXCEPTION

                await self.test_repository.queue_a_test_case_run(
                    session=session,
                    test_case_id=test_case_id,
                    task_run_id=task_run_id,
                )
                logger.info(
                    f"Successfully queued test case with ID {test_case_id} for execution"
                )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test case not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to queue test case: {str(e)}"
            )

    async def update_test_case_run(
        self,
        session: AsyncSession,
        run_id: str,
        status: Optional[TestCaseRunStatus] = None,
        actual_output: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        execution_time_ms: Optional[float] = None,
        run_detail: Optional[Dict[str, Any]] = None,
        criteria_results: Optional[Dict[str, Any]] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
    ) -> FlowTestCaseRunModel:
        """
        Update a test case run by its ID.

        Args:
            run_id: Test case run ID to update
            status: New run status (optional)
            actual_output: New actual output data (optional)
            error_message: New error message (optional)
            execution_time_ms: New execution time in milliseconds (optional)
            run_detail: New run detail data (optional)
            criteria_results: New criteria results (optional)
            started_at: New start time (optional)
            finished_at: New finish time (optional)

        Returns:
            Updated test case run model
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Update the test case run
                updated_test_case_run = await self.test_repository.update_test_case_run(
                    session=session,
                    run_id=run_id,
                    status=status,
                    actual_output=actual_output,
                    error_message=error_message,
                    execution_time_ms=execution_time_ms,
                    run_detail=run_detail,
                    criteria_results=criteria_results,
                    started_at=started_at,
                    finished_at=finished_at,
                )
                logger.info(f"Successfully updated test case run with ID {run_id}")

                return updated_test_case_run
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test case run not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to update test case run: {str(e)}"
            )

    async def set_test_case_run_status(
        self, session: AsyncSession, task_run_id: str, status: str
    ) -> None:
        """
        Set the status of a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run
            status: The status to set for the test case run
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                await self.test_repository.set_test_case_run_status(
                    session=session, task_run_id=task_run_id, status=status
                )
                logger.info(
                    f"Successfully set status to '{status}' for test case run with task run ID {task_run_id}"
                )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test case run not found")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to set test case run status: {str(e)}"
            )

    async def get_latest_test_case_run_status(
        self, session: AsyncSession, test_case_id: int
    ) -> str:
        """
        Get the status of the latest test case run for a given test case ID.

        Args:
            test_case_id: The ID of the test case

        Returns:
            str: The status of the latest test case run, or PENDING if no runs exist
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test case exists
                test_case = await self.test_repository.get_test_case_by_id(
                    session=session, case_id=test_case_id
                )
                if not test_case:
                    logger.warning(f"Test case with ID {test_case_id} not found")
                    raise NOT_FOUND_EXCEPTION

                # Get the latest test case run status
                status = await self.test_repository.get_latest_test_case_run_status(
                    session=session, test_case_id=test_case_id
                )
                logger.info(
                    f"Successfully retrieved latest run status '{status}' for test case with ID {test_case_id}"
                )
                return status
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Test case not found")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve latest run status: {str(e)}",
            )

    async def get_latest_test_cases_run_status(
        self, session: AsyncSession, test_case_ids: list[int]
    ) -> dict[int, str]:
        """
        Get the status of the latest test case run for multiple test case IDs.

        Args:
            test_case_ids: List of test case IDs

        Returns:
            dict[int, str]: Dictionary mapping test case IDs to their latest run status,
                           or PENDING if no runs exist for a test case
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                if not test_case_ids:
                    return {}

                # First check if all test cases exist
                existing_test_cases = set()
                for test_case_id in test_case_ids:
                    test_case = await self.test_repository.get_test_case_by_id(
                        session=session, case_id=test_case_id
                    )
                    if test_case:
                        existing_test_cases.add(test_case_id)
                    else:
                        logger.warning(f"Test case with ID {test_case_id} not found")

                # Get the latest test case run statuses for existing test cases
                if existing_test_cases:
                    statuses = (
                        await self.test_repository.get_latest_test_cases_run_status(
                            session=session, test_case_ids=list(existing_test_cases)
                        )
                    )
                    logger.info(
                        f"Successfully retrieved latest run statuses for {len(existing_test_cases)} test cases"
                    )
                    return statuses
                else:
                    logger.warning("No valid test cases found")
                    return {}
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve latest run statuses: {str(e)}",
            )

    async def get_test_case_run_by_task_id(
        self, session: AsyncSession, task_run_id: str
    ) -> Optional[FlowTestCaseRunModel]:
        """
        Get a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run

        Returns:
            Optional[FlowTestCaseRunModel]: The test case run model, or None if not found
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                test_case_run = await self.test_repository.get_test_case_run_by_task_id(
                    session=session, task_run_id=task_run_id
                )
                if test_case_run:
                    logger.info(
                        f"Successfully retrieved test case run with task_run_id {task_run_id}"
                    )
                else:
                    logger.info(
                        f"Test case run with task_run_id {task_run_id} not found"
                    )
                return test_case_run
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve test case run: {str(e)}"
            )

    async def get_test_case_pass_criteria(
        self, session: AsyncSession, test_case_id: int
    ) -> Optional[PassCriteriaValidator]:
        """
        Get the pass criteria for a specific test case.

        Args:
            test_case_id: The ID of the test case

        Returns:
            Optional[PassCriteriaValidator]: The pass criteria validator for the test case,
                                           or None if not found
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # First check if the test case exists
                test_case = await self.test_repository.get_test_case_by_id(
                    session=session, case_id=test_case_id
                )
                if not test_case:
                    logger.warning(f"Test case with ID {test_case_id} not found")
                    return None

                # Get the pass criteria from the test case
                pass_criteria = test_case.pass_criteria
                logger.info(
                    f"Successfully retrieved pass criteria for test case with ID {test_case_id}"
                )

                return pass_criteria
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve pass criteria: {str(e)}"
            )

    async def cancel_test_case_run(
        self, session: AsyncSession, task_run_id: str
    ) -> bool:
        """
        Cancel a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run to cancel

        Returns:
            bool: True if the test was successfully cancelled, False otherwise
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Get the test case run to check its current status
                test_case_run = await self.test_repository.get_test_case_run_by_task_id(
                    session=session, task_run_id=task_run_id
                )

                if not test_case_run:
                    logger.warning(
                        f"Test case run with task_run_id {task_run_id} not found"
                    )
                    return False

                current_status = str(test_case_run.status)

                # Check if the test can be cancelled
                if current_status in [
                    TestCaseRunStatus.PASSED.value,
                    TestCaseRunStatus.FAILED.value,
                    TestCaseRunStatus.CANCELLED.value,
                    TestCaseRunStatus.SYSTEM_ERROR.value,
                ]:
                    logger.info(
                        f"Test case run with task_run_id {task_run_id} is already in terminal status: {current_status}"
                    )
                    return False

                # Update the status to CANCELLED
                await self.test_repository.set_test_case_run_status(
                    session=session,
                    task_run_id=task_run_id,
                    status=TestCaseRunStatus.CANCELLED.value,
                )

                logger.info(
                    f"Successfully cancelled test case run with task_run_id {task_run_id}"
                )
                return True
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to cancel test case run: {str(e)}"
            )

    async def cancel_test_case_runs(
        self, session: AsyncSession, task_run_ids: list[str]
    ) -> dict[str, bool]:
        """
        Cancel multiple test case runs by their task run IDs.

        Args:
            task_run_ids: List of task run IDs to cancel

        Returns:
            dict[str, bool]: Dictionary mapping task run IDs to their cancellation status
        """
        try:
            async with asyncio.timeout(60):  # Longer timeout for bulk operations
                if not task_run_ids:
                    logger.warning("No task run IDs provided for cancellation")
                    return {}

                results = {}

                for task_run_id in task_run_ids:
                    try:
                        success = await self.cancel_test_case_run(
                            session=session, task_run_id=task_run_id
                        )
                        results[task_run_id] = success
                    except Exception as e:
                        logger.error(
                            f"Failed to cancel test case run with task_run_id {task_run_id}: {str(e)}"
                        )
                        results[task_run_id] = False

                successful_cancellations = sum(
                    1 for success in results.values() if success
                )
                logger.info(
                    f"Cancelled {successful_cancellations} out of {len(task_run_ids)} test case runs"
                )

                return results
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Bulk operation timed out")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to cancel test case runs: {str(e)}"
            )
