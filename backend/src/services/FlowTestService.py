from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional

from loguru import logger
from redis import Redis
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
    def create_test_suite(
        self, flow_id: str, name: str, description: Optional[str] = None
    ) -> FlowTestSuiteModel:
        """
        Create a new test suite for a flow
        """
        pass

    @abstractmethod
    def delete_test_suite(self, suite_id: int) -> None:
        """
        Delete a test suite by its ID
        """
        pass

    @abstractmethod
    def update_test_suite(
        self,
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
    def get_test_suite_by_id(self, suite_id: int) -> Optional[FlowTestSuiteModel]:
        """
        Get a test suite by its ID
        """
        pass

    @abstractmethod
    def get_test_suites_by_flow_id(self, flow_id: str) -> list[FlowTestSuiteModel]:
        """
        Get all test suites for a specific flow
        """
        pass

    @abstractmethod
    def create_empty_test_case(
        self,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new empty test case for a test suite
        """
        pass

    @abstractmethod
    def get_test_case_by_id(self, case_id: int) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID
        """
        pass

    @abstractmethod
    def delete_test_case(self, case_id: int) -> None:
        """
        Delete a test case by its ID
        """
        pass

    @abstractmethod
    def update_test_case(
        self,
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
    def get_test_suites_with_case_previews(self, flow_id: str) -> list[dict]:
        """
        Get all test suites for a specific flow with test case previews
        """
        pass

    @abstractmethod
    def queue_test_case_run(self, test_case_id: int, task_run_id: str) -> None:
        """
        Queue a test case for execution
        """
        pass

    @abstractmethod
    def update_test_case_run(
        self,
        run_id: int,
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
    def set_test_case_run_status(self, task_run_id: str, status: str) -> None:
        """
        Set the status of a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run
            status: The status to set for the test case run
        """
        pass

    @abstractmethod
    def get_latest_test_case_run_status(self, test_case_id: int) -> str:
        """
        Get the status of the latest test case run for a given test case ID.

        Args:
            test_case_id: The ID of the test case

        Returns:
            str: The status of the latest test case run, or PENDING if no runs exist
        """
        pass

    @abstractmethod
    def get_latest_test_cases_run_status(
        self, test_case_ids: list[int]
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
    def get_test_case_pass_criteria(
        self, test_case_id: int
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
    def get_test_case_run_by_task_id(
        self, task_run_id: str
    ) -> Optional[FlowTestCaseRunModel]:
        """
        Get a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run

        Returns:
            Optional[FlowTestCaseRunModel]: The test case run model, or None if not found
        """
        pass


class FlowTestService(FlowTestServiceInterface):
    """
    Flow test service implementation
    """

    def __init__(
        self, test_repository: FlowTestRepository, redis_client: Optional[Redis] = None
    ):
        self.test_repository = test_repository
        self.redis_client = redis_client
        self.cache_helper = CacheHelper(redis_client, ttl=3600)

    def create_test_suite(
        self, flow_id: str, name: str, description: Optional[str] = None
    ) -> FlowTestSuiteModel:
        """
        Create a new test suite for a flow
        """
        try:
            test_suite = self.test_repository.create_test_suite(
                flow_id=flow_id, name=name, description=description
            )
            logger.info(f"Successfully created test suite '{name}' for flow {flow_id}")
            return test_suite
        except Exception as e:
            logger.error(f"Error creating test suite for flow {flow_id}: {str(e)}")
            raise

    def delete_test_suite(self, suite_id: int) -> None:
        """
        Delete a test suite by its ID
        """
        try:
            # First check if the test suite exists
            test_suite = self.test_repository.get_test_suite_by_id(suite_id=suite_id)
            if not test_suite:
                logger.warning(f"Test suite with ID {suite_id} not found")
                raise NOT_FOUND_EXCEPTION

            self.test_repository.delete_test_suite(suite_id=suite_id)
            logger.info(f"Successfully deleted test suite with ID {suite_id}")
        except Exception as e:
            logger.error(f"Error deleting test suite with ID {suite_id}: {str(e)}")
            raise

    def update_test_suite(
        self,
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
            # First check if the test suite exists
            test_suite = self.test_repository.get_test_suite_by_id(suite_id=suite_id)
            if not test_suite:
                logger.warning(f"Test suite with ID {suite_id} not found")
                raise NOT_FOUND_EXCEPTION

            # Update the test suite
            updated_test_suite = self.test_repository.update_test_suite(
                suite_id=suite_id,
                flow_id=flow_id,
                name=name,
                description=description,
                is_active=is_active,
            )
            logger.info(f"Successfully updated test suite with ID {suite_id}")

            return updated_test_suite
        except Exception as e:
            logger.error(f"Error updating test suite with ID {suite_id}: {str(e)}")
            raise

    def get_test_suite_by_id(self, suite_id: int) -> Optional[FlowTestSuiteModel]:
        """
        Get a test suite by its ID
        """
        try:
            test_suite = self.test_repository.get_test_suite_by_id(suite_id=suite_id)
            if test_suite:
                logger.info(f"Successfully retrieved test suite with ID {suite_id}")
            else:
                logger.info(f"Test suite with ID {suite_id} not found")
            return test_suite
        except Exception as e:
            logger.error(f"Error retrieving test suite with ID {suite_id}: {str(e)}")
            raise

    def get_test_suites_by_flow_id(self, flow_id: str) -> list[FlowTestSuiteModel]:
        """
        Get all test suites for a specific flow
        """
        try:
            test_suites = self.test_repository.get_test_suites_by_flow_id(
                flow_id=flow_id
            )
            logger.info(
                f"Successfully retrieved {len(test_suites)} test suites for flow {flow_id}"  # noqa
            )
            return test_suites
        except Exception as e:
            logger.error(f"Error retrieving test suites for flow {flow_id}: {str(e)}")
            raise

    def get_test_case_by_id(self, case_id: int) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID
        """
        cache_key = f"{CACHE_PREFIX.TEST_CASE}:{case_id}"

        try:
            # Try to get from cache first
            cached_test_case = self.cache_helper.get(cache_key, FlowTestCaseModel)
            if cached_test_case:
                logger.info(f"Retrieved test case with ID {case_id} from cache")
                return cached_test_case

            # Get from database if not in cache
            test_case = self.test_repository.get_test_case_by_id(case_id=case_id)

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
        except Exception as e:
            logger.error(f"Error retrieving test case with ID {case_id}: {str(e)}")
            raise

    def create_empty_test_case(
        self,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new empty test case for a test suite
        """
        try:
            # First check if the test suite exists
            test_suite = self.test_repository.get_test_suite_by_id(suite_id=suite_id)
            if not test_suite:
                logger.warning(f"Test suite with ID {suite_id} not found")
                raise NOT_FOUND_EXCEPTION

            test_case = self.test_repository.create_empty_test_case(
                suite_id=suite_id, name=name, desc=desc
            )
            logger.info(
                f"Successfully created empty test case '{name}' for suite {suite_id}"
            )
            return test_case
        except Exception as e:
            logger.error(
                f"Error creating empty test case for suite {suite_id}: {str(e)}"
            )
            raise

    def delete_test_case(self, case_id: int) -> None:
        """
        Delete a test case by its ID
        """
        cache_key = f"{CACHE_PREFIX.TEST_CASE}:{case_id}"

        try:
            # First check if the test case exists
            test_case = self.test_repository.get_test_case_by_id(case_id=case_id)
            if not test_case:
                logger.warning(f"Test case with ID {case_id} not found")
                raise NOT_FOUND_EXCEPTION

            self.test_repository.delete_test_case(case_id=case_id)
            logger.info(
                f"Successfully deleted test case with ID {case_id} from database"
            )

            # Invalidate cache
            self.cache_helper.delete(cache_key)
            logger.info(f"Invalidated cache for test case with ID {case_id}")
        except Exception as e:
            logger.error(f"Error deleting test case with ID {case_id}: {str(e)}")
            raise

    def update_test_case(
        self,
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
            # First check if the test case exists
            test_case = self.test_repository.get_test_case_by_id(case_id=case_id)
            if not test_case:
                logger.warning(f"Test case with ID {case_id} not found")
                raise NOT_FOUND_EXCEPTION

            # Update the test case
            updated_test_case = self.test_repository.update_test_case(
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
        except Exception as e:
            logger.error(f"Error updating test case with ID {case_id}: {str(e)}")
            raise

    def get_test_suites_with_case_previews(self, flow_id: str) -> list[dict]:
        """
        Get all test suites for a specific flow with test case previews
        """
        try:
            test_suites = self.test_repository.get_test_suites_with_case_previews(
                flow_id=flow_id
            )
            logger.info(
                f"Successfully retrieved {len(test_suites)} test suites with case previews for flow {flow_id}"  # noqa
            )
            return test_suites
        except Exception as e:
            logger.error(
                f"Error retrieving test suites with case previews for flow {flow_id}: {str(e)}"  # noqa
            )
            raise

    def queue_test_case_run(self, test_case_id: int, task_run_id: str) -> None:
        """
        Queue a test case for execution
        """
        try:
            # First check if the test case exists
            self.test_repository.queue_a_test_case_run(
                test_case_id=test_case_id, task_run_id=task_run_id
            )
            logger.info(
                f"Successfully queued test case with ID {test_case_id} for execution"
            )
        except Exception as e:
            logger.error(
                f"Error queuing test case with ID {test_case_id} for execution: {str(e)}"  # noqa
            )
            raise

    def update_test_case_run(
        self,
        run_id: int,
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
            # Update the test case run
            updated_test_case_run = self.test_repository.update_test_case_run(
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
        except Exception as e:
            logger.error(f"Error updating test case run with ID {run_id}: {str(e)}")
            raise

    def set_test_case_run_status(self, task_run_id: str, status: str) -> None:
        """
        Set the status of a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run
            status: The status to set for the test case run
        """
        try:
            self.test_repository.set_test_case_run_status(
                task_run_id=task_run_id, status=status
            )
            logger.info(
                f"Successfully set status to '{status}' for test case run with task run ID {task_run_id}"
            )
        except Exception as e:
            logger.error(
                f"Error setting status for test case run with task run ID {task_run_id}: {str(e)}"
            )
            raise

    def get_latest_test_case_run_status(self, test_case_id: int) -> str:
        """
        Get the status of the latest test case run for a given test case ID.

        Args:
            test_case_id: The ID of the test case

        Returns:
            str: The status of the latest test case run, or PENDING if no runs exist
        """
        try:
            # First check if the test case exists
            test_case = self.test_repository.get_test_case_by_id(case_id=test_case_id)
            if not test_case:
                logger.warning(f"Test case with ID {test_case_id} not found")
                raise NOT_FOUND_EXCEPTION

            # Get the latest test case run status
            status = self.test_repository.get_latest_test_case_run_status(
                test_case_id=test_case_id
            )
            logger.info(
                f"Successfully retrieved latest run status '{status}' for test case with ID {test_case_id}"
            )
            return status
        except Exception as e:
            logger.error(
                f"Error retrieving latest run status for test case with ID {test_case_id}: {str(e)}"
            )
            raise

    def get_latest_test_cases_run_status(
        self, test_case_ids: list[int]
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
            if not test_case_ids:
                return {}

            # First check if all test cases exist
            existing_test_cases = set()
            for test_case_id in test_case_ids:
                test_case = self.test_repository.get_test_case_by_id(
                    case_id=test_case_id
                )
                if test_case:
                    existing_test_cases.add(test_case_id)
                else:
                    logger.warning(f"Test case with ID {test_case_id} not found")

            # Get the latest test case run statuses for existing test cases
            if existing_test_cases:
                statuses = self.test_repository.get_latest_test_cases_run_status(
                    test_case_ids=list(existing_test_cases)
                )
                logger.info(
                    f"Successfully retrieved latest run statuses for {len(existing_test_cases)} test cases"
                )
                return statuses
            else:
                logger.warning("No valid test cases found")
                return {}

        except Exception as e:
            logger.error(
                f"Error retrieving latest run statuses for test cases: {str(e)}"
            )
            raise

    def get_test_case_run_by_task_id(
        self, task_run_id: str
    ) -> Optional[FlowTestCaseRunModel]:
        """
        Get a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run

        Returns:
            Optional[FlowTestCaseRunModel]: The test case run model, or None if not found
        """
        try:
            test_case_run = self.test_repository.get_test_case_run_by_task_id(
                task_run_id=task_run_id
            )
            if test_case_run:
                logger.info(
                    f"Successfully retrieved test case run with task_run_id {task_run_id}"
                )
            else:
                logger.info(f"Test case run with task_run_id {task_run_id} not found")
            return test_case_run
        except Exception as e:
            logger.error(
                f"Error retrieving test case run with task_run_id {task_run_id}: {str(e)}"
            )
            raise

    def get_test_case_pass_criteria(
        self, test_case_id: int
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
            # First check if the test case exists
            test_case = self.test_repository.get_test_case_by_id(case_id=test_case_id)
            if not test_case:
                logger.warning(f"Test case with ID {test_case_id} not found")
                return None

            # Get the pass criteria from the test case
            pass_criteria = test_case.pass_criteria
            logger.info(
                f"Successfully retrieved pass criteria for test case with ID {test_case_id}"
            )

            return pass_criteria
        except Exception as e:
            logger.error(
                f"Error retrieving pass criteria for test case with ID {test_case_id}: {str(e)}"
            )
            raise
