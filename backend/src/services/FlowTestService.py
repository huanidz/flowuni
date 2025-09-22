from abc import ABC, abstractmethod
from typing import Optional

from loguru import logger
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
from src.models.alchemy.flows.FlowTestCaseModel import FlowTestCaseModel
from src.models.alchemy.flows.FlowTestSuiteModel import FlowTestSuiteModel
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
    def get_test_suites_with_cases_by_flow_id(
        self, flow_id: str
    ) -> list[FlowTestSuiteModel]:
        """
        Get all test suites with their test cases for a specific flow
        """
        pass

    @abstractmethod
    def create_test_case(
        self,
        suite_id: int,
        name: str,
        description: Optional[str] = None,
        input_data: Optional[dict] = None,
        pass_criteria: Optional[dict] = None,
        test_metadata: Optional[dict] = None,
        run_detail: Optional[dict] = None,
        timeout_ms: Optional[float] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new test case for a test suite
        """
        pass

    @abstractmethod
    def get_test_case_by_id(self, case_id: int) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID
        """
        pass

    @abstractmethod
    def update_test_case(
        self,
        case_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
        input_data: Optional[dict] = None,
        pass_criteria: Optional[dict] = None,
        test_metadata: Optional[dict] = None,
        run_detail: Optional[dict] = None,
        timeout_ms: Optional[float] = None,
        status: Optional[str] = None,
        actual_output: Optional[dict] = None,
        error_message: Optional[str] = None,
        execution_time_ms: Optional[float] = None,
    ) -> FlowTestCaseModel:
        """
        Update a test case by its ID
        """
        pass

    @abstractmethod
    def delete_test_case(self, case_id: int) -> None:
        """
        Delete a test case by its ID
        """
        pass


class FlowTestService(FlowTestServiceInterface):
    """
    Flow test service implementation
    """

    def __init__(self, test_repository: FlowTestRepository):
        self.test_repository = test_repository

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
                f"Successfully retrieved {len(test_suites)} test suites for flow {flow_id}"
            )
            return test_suites
        except Exception as e:
            logger.error(f"Error retrieving test suites for flow {flow_id}: {str(e)}")
            raise

    def get_test_suites_with_cases_by_flow_id(
        self, flow_id: str
    ) -> list[FlowTestSuiteModel]:
        """
        Get all test suites with their test cases for a specific flow
        """
        try:
            test_suites = self.test_repository.get_test_suites_with_cases_by_flow_id(
                flow_id=flow_id
            )
            logger.info(
                f"Successfully retrieved {len(test_suites)} test suites with cases for flow {flow_id}"
            )
            return test_suites
        except Exception as e:
            logger.error(
                f"Error retrieving test suites with cases for flow {flow_id}: {str(e)}"
            )
            raise

    def create_test_case(
        self,
        suite_id: int,
        name: str,
        description: Optional[str] = None,
        input_data: Optional[dict] = None,
        pass_criteria: Optional[dict] = None,
        test_metadata: Optional[dict] = None,
        run_detail: Optional[dict] = None,
        timeout_ms: Optional[float] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new test case for a test suite
        """
        try:
            # First check if the test suite exists
            test_suite = self.test_repository.get_test_suite_by_id(suite_id=suite_id)
            if not test_suite:
                logger.warning(f"Test suite with ID {suite_id} not found")
                raise NOT_FOUND_EXCEPTION

            test_case = self.test_repository.create_test_case(
                suite_id=suite_id,
                name=name,
                description=description,
                input_data=input_data,
                pass_criteria=pass_criteria,
                test_metadata=test_metadata,
                run_detail=run_detail,
                timeout_ms=timeout_ms,
            )
            logger.info(
                f"Successfully created test case '{name}' for test suite {suite_id}"
            )
            return test_case
        except Exception as e:
            logger.error(
                f"Error creating test case for test suite {suite_id}: {str(e)}"
            )
            raise

    def get_test_case_by_id(self, case_id: int) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID
        """
        try:
            test_case = self.test_repository.get_test_case_by_id(case_id=case_id)
            if test_case:
                logger.info(f"Successfully retrieved test case with ID {case_id}")
            else:
                logger.info(f"Test case with ID {case_id} not found")
            return test_case
        except Exception as e:
            logger.error(f"Error retrieving test case with ID {case_id}: {str(e)}")
            raise

    def update_test_case(
        self,
        case_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
        input_data: Optional[dict] = None,
        pass_criteria: Optional[dict] = None,
        test_metadata: Optional[dict] = None,
        run_detail: Optional[dict] = None,
        timeout_ms: Optional[float] = None,
        status: Optional[str] = None,
        actual_output: Optional[dict] = None,
        error_message: Optional[str] = None,
        execution_time_ms: Optional[float] = None,
    ) -> FlowTestCaseModel:
        """
        Update a test case by its ID
        """
        try:
            # First check if the test case exists
            test_case = self.test_repository.get_test_case_by_id(case_id=case_id)
            if not test_case:
                logger.warning(f"Test case with ID {case_id} not found")
                raise NOT_FOUND_EXCEPTION

            updated_test_case = self.test_repository.update_test_case(
                case_id=case_id,
                name=name,
                description=description,
                is_active=is_active,
                input_data=input_data,
                pass_criteria=pass_criteria,
                test_metadata=test_metadata,
                run_detail=run_detail,
                timeout_ms=timeout_ms,
                status=status,
                actual_output=actual_output,
                error_message=error_message,
                execution_time_ms=execution_time_ms,
            )
            logger.info(f"Successfully updated test case with ID {case_id}")
            return updated_test_case
        except Exception as e:
            logger.error(f"Error updating test case with ID {case_id}: {str(e)}")
            raise

    def delete_test_case(self, case_id: int) -> None:
        """
        Delete a test case by its ID
        """
        try:
            # First check if the test case exists
            test_case = self.test_repository.get_test_case_by_id(case_id=case_id)
            if not test_case:
                logger.warning(f"Test case with ID {case_id} not found")
                raise NOT_FOUND_EXCEPTION

            self.test_repository.delete_test_case(case_id=case_id)
            logger.info(f"Successfully deleted test case with ID {case_id}")
        except Exception as e:
            logger.error(f"Error deleting test case with ID {case_id}: {str(e)}")
            raise
