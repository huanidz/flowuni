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
    def create_empty_test_case(
        self,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
        flow_definition: Optional[dict] = None,
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
    def get_test_suites_with_case_previews(self, flow_id: str) -> list[dict]:
        """
        Get all test suites for a specific flow with test case previews
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

    def create_empty_test_case(
        self,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
        flow_definition: Optional[dict] = None,
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
                suite_id=suite_id, name=name, desc=desc, flow_definition=flow_definition
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

    def get_test_suites_with_case_previews(self, flow_id: str) -> list[dict]:
        """
        Get all test suites for a specific flow with test case previews
        """
        try:
            test_suites = self.test_repository.get_test_suites_with_case_previews(
                flow_id=flow_id
            )
            logger.info(
                f"Successfully retrieved {len(test_suites)} test suites with case previews for flow {flow_id}"
            )
            return test_suites
        except Exception as e:
            logger.error(
                f"Error retrieving test suites with case previews for flow {flow_id}: {str(e)}"
            )
            raise
