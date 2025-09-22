from abc import ABC, abstractmethod
from typing import Optional

from loguru import logger
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
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
