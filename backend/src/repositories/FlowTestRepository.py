from typing import Optional

from loguru import logger
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
from src.models.alchemy.flows.FlowTestCaseModel import FlowTestCaseModel
from src.models.alchemy.flows.FlowTestSuiteModel import FlowTestSuiteModel
from src.repositories.BaseRepository import BaseRepository


class FlowTestRepository(BaseRepository):
    """
    Flow test repository for managing test suites and test cases.
    """

    def __init__(self, db_session: Session):
        super().__init__(db_session=db_session)
        self.model = FlowTestSuiteModel
        logger.info("FlowTestRepository initialized.")

    def create_test_suite(
        self, flow_id: str, name: str, description: Optional[str] = None
    ) -> FlowTestSuiteModel:
        """
        Create a new test suite for a flow.
        """
        try:
            test_suite = FlowTestSuiteModel(
                flow_id=flow_id,
                name=name,
                description=description,
                is_active=True,
            )
            self.db_session.add(test_suite)
            self.db_session.commit()
            self.db_session.refresh(test_suite)

            logger.info(f"Created new test suite '{name}' for flow {flow_id}")
            return test_suite

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when creating test suite for flow {flow_id}: {e}"
            )
            raise ValueError(
                "Failed to create test suite due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating test suite for flow {flow_id}: {e}")
            raise e

    def get_test_suite_by_id(self, suite_id: int) -> Optional[FlowTestSuiteModel]:
        """
        Get a test suite by its ID.
        """
        try:
            test_suite = (
                self.db_session.query(FlowTestSuiteModel)
                .filter_by(id=suite_id)
                .one_or_none()
            )
            if test_suite:
                logger.info(f"Retrieved test suite with ID: {suite_id}")
            else:
                logger.info(f"Test suite with ID: {suite_id} not found.")
            return test_suite
        except Exception as e:
            logger.error(f"Error retrieving test suite by ID {suite_id}: {e}")
            self.db_session.rollback()
            raise e

    def delete_test_suite(self, suite_id: int) -> None:
        """
        Delete a test suite by its ID.
        """
        try:
            test_suite = (
                self.db_session.query(FlowTestSuiteModel).filter_by(id=suite_id).first()
            )
            if not test_suite:
                logger.warning(
                    f"Attempted to delete non-existent test suite with ID: {suite_id}"
                )
                raise NoResultFound(f"Test suite with ID {suite_id} not found.")

            self.db_session.delete(test_suite)
            self.db_session.commit()
            logger.info(f"Deleted test suite with ID: {suite_id}")

        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when deleting test suite with ID {suite_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error deleting test suite with ID {suite_id}: {e}")
            raise e

    def get_test_suites_by_flow_id(self, flow_id: str) -> list[FlowTestSuiteModel]:
        """
        Get all test suites for a specific flow.
        """
        try:
            test_suites = (
                self.db_session.query(FlowTestSuiteModel)
                .filter_by(flow_id=flow_id)
                .all()
            )
            logger.info(f"Retrieved {len(test_suites)} test suites for flow {flow_id}")
            return test_suites
        except Exception as e:
            logger.error(f"Error retrieving test suites for flow {flow_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_test_suites_with_cases_by_flow_id(
        self, flow_id: str
    ) -> list[FlowTestSuiteModel]:
        """
        Get all test suites with their test cases for a specific flow.
        """
        try:
            test_suites = (
                self.db_session.query(FlowTestSuiteModel)
                .filter_by(flow_id=flow_id)
                .all()
            )

            # Load test cases for each suite
            for suite in test_suites:
                # Accessing test_cases will load them due to the relationship
                _ = suite.test_cases

            logger.info(
                f"Retrieved {len(test_suites)} test suites with cases for flow {flow_id}"
            )
            return test_suites
        except Exception as e:
            logger.error(
                f"Error retrieving test suites with cases for flow {flow_id}: {e}"
            )
            self.db_session.rollback()
            raise e

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
        Create a new test case for a test suite.
        """
        try:
            test_case = FlowTestCaseModel(
                suite_id=suite_id,
                name=name,
                description=description,
                is_active=True,
                input_data=input_data,
                pass_criteria=pass_criteria,
                test_metadata=test_metadata,
                run_detail=run_detail,
                timeout_ms=timeout_ms,
            )
            self.db_session.add(test_case)
            self.db_session.commit()
            self.db_session.refresh(test_case)

            logger.info(f"Created new test case '{name}' for test suite {suite_id}")
            return test_case

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when creating test case for test suite {suite_id}: {e}"
            )
            raise ValueError(
                "Failed to create test case due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating test case for test suite {suite_id}: {e}")
            raise e

    def get_test_case_by_id(self, case_id: int) -> Optional[FlowTestCaseModel]:
        """
        Get a test case by its ID.
        """
        try:
            test_case = (
                self.db_session.query(FlowTestCaseModel)
                .filter_by(id=case_id)
                .one_or_none()
            )
            if test_case:
                logger.info(f"Retrieved test case with ID: {case_id}")
            else:
                logger.info(f"Test case with ID: {case_id} not found.")
            return test_case
        except Exception as e:
            logger.error(f"Error retrieving test case by ID {case_id}: {e}")
            self.db_session.rollback()
            raise e

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
        Update a test case by its ID.
        """
        try:
            test_case = (
                self.db_session.query(FlowTestCaseModel).filter_by(id=case_id).first()
            )
            if not test_case:
                logger.warning(
                    f"Attempted to update non-existent test case with ID: {case_id}"
                )
                raise NoResultFound(f"Test case with ID {case_id} not found.")

            # Update fields if provided
            if name is not None:
                test_case.name = name
            if description is not None:
                test_case.description = description
            if is_active is not None:
                test_case.is_active = is_active
            if input_data is not None:
                test_case.input_data = input_data
            if pass_criteria is not None:
                test_case.pass_criteria = pass_criteria
            if test_metadata is not None:
                test_case.test_metadata = test_metadata
            if run_detail is not None:
                test_case.run_detail = run_detail
            if timeout_ms is not None:
                test_case.timeout_ms = timeout_ms
            if status is not None:
                test_case.status = status
            if actual_output is not None:
                test_case.actual_output = actual_output
            if error_message is not None:
                test_case.error_message = error_message
            if execution_time_ms is not None:
                test_case.execution_time_ms = execution_time_ms

            self.db_session.commit()
            self.db_session.refresh(test_case)
            logger.info(f"Updated test case with ID: {case_id}")
            return test_case

        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when updating test case with ID {case_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error updating test case with ID {case_id}: {e}")
            raise e

    def delete_test_case(self, case_id: int) -> None:
        """
        Delete a test case by its ID.
        """
        try:
            test_case = (
                self.db_session.query(FlowTestCaseModel).filter_by(id=case_id).first()
            )
            if not test_case:
                logger.warning(
                    f"Attempted to delete non-existent test case with ID: {case_id}"
                )
                raise NoResultFound(f"Test case with ID {case_id} not found.")

            self.db_session.delete(test_case)
            self.db_session.commit()
            logger.info(f"Deleted test case with ID: {case_id}")

        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when deleting test case with ID {case_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error deleting test case with ID {case_id}: {e}")
            raise e
