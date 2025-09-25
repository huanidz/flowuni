from typing import Any, Dict, Optional

from loguru import logger
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
from src.models.alchemy.flows.FlowTestCaseModel import FlowTestCaseModel
from src.models.alchemy.flows.FlowTestCaseRunModel import (
    FlowTestCaseRunModel,
    TestCaseRunStatus,
)
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

        Raises:
            NoResultFound: If test suite with given ID is not found
        """
        try:
            # Get the test suite to update
            test_suite = (
                self.db_session.query(FlowTestSuiteModel).filter_by(id=suite_id).first()
            )
            if not test_suite:
                logger.warning(
                    f"Attempted to update non-existent test suite with ID: {suite_id}"
                )
                raise NoResultFound(f"Test suite with ID {suite_id} not found.")

            # Update fields if provided
            if flow_id is not None:
                test_suite.flow_id = flow_id
            if name is not None:
                test_suite.name = name
            if description is not None:
                test_suite.description = description
            if is_active is not None:
                test_suite.is_active = is_active

            self.db_session.commit()
            self.db_session.refresh(test_suite)
            logger.info(f"Updated test suite with ID: {suite_id}")
            return test_suite

        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when updating test suite with ID {suite_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error updating test suite with ID {suite_id}: {e}")
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

    def create_empty_test_case(
        self,
        suite_id: int,
        name: str,
        desc: Optional[str] = None,
    ) -> FlowTestCaseModel:
        """
        Create a new empty test case for a test suite.
        """
        try:
            test_case = FlowTestCaseModel(
                suite_id=suite_id,
                name=name,
                description=desc,
                is_active=True,
            )
            self.db_session.add(test_case)
            self.db_session.commit()
            self.db_session.refresh(test_case)

            logger.info(f"Created new test case '{name}' for suite {suite_id}")
            return test_case

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when creating test case for suite {suite_id}: {e}"
            )
            raise ValueError(
                "Failed to create test case due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating test case for suite {suite_id}: {e}")
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

    def update_test_case(  # noqa
        self,
        case_id: int,
        suite_id: Optional[int] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
        input_text: Optional[str] = None,
        input_metadata: Optional[Dict[str, Any]] = None,
        pass_criteria: Optional[Dict[str, Any]] = None,
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

        Raises:
            NoResultFound: If test case with given ID is not found
        """
        try:
            # Get the test case to update
            test_case = (
                self.db_session.query(FlowTestCaseModel).filter_by(id=case_id).first()
            )
            if not test_case:
                logger.warning(
                    f"Attempted to update non-existent test case with ID: {case_id}"
                )
                raise NoResultFound(f"Test case with ID {case_id} not found.")

            # Update fields if provided
            if suite_id is not None:
                test_case.suite_id = suite_id
            if name is not None:
                test_case.name = name
            if description is not None:
                test_case.description = description
            if is_active is not None:
                test_case.is_active = is_active
            if input_text is not None:
                test_case.input_text = input_text
            if input_metadata is not None:
                test_case.input_metadata = input_metadata
            if pass_criteria is not None:
                test_case.pass_criteria = pass_criteria
            if timeout_ms is not None:
                test_case.timeout_ms = timeout_ms

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

    def get_test_suites_with_case_previews(self, flow_id: str) -> list[dict]:
        """
        Get all test suites for a specific flow with their test case previews.

        Returns:
            list[dict]: List of test suites with their test case previews (only needed fields)
        """  # noqa
        try:
            # Get all test suites for the flow
            test_suites = (
                self.db_session.query(FlowTestSuiteModel)
                .filter_by(flow_id=flow_id)
                .all()
            )

            result = []

            # For each test suite, get only the needed fields from test cases
            for suite in test_suites:
                suite_dict = {
                    "id": suite.id,
                    "flow_id": suite.flow_id,
                    "name": suite.name,
                    "description": suite.description,
                    "is_active": suite.is_active,
                    "test_cases": [],
                }

                # Query only the needed fields from test cases
                test_cases = (
                    self.db_session.query(
                        FlowTestCaseModel.id,
                        FlowTestCaseModel.suite_id,
                        FlowTestCaseModel.name,
                        FlowTestCaseModel.description,
                        FlowTestCaseModel.is_active,
                    )
                    .filter_by(suite_id=suite.id)
                    .all()
                )

                # Convert test case tuples to dictionaries
                for case in test_cases:
                    suite_dict["test_cases"].append(
                        {
                            "id": case.id,
                            "suite_id": case.suite_id,
                            "name": case.name,
                            "description": case.description,
                            "is_active": case.is_active,
                        }
                    )

                result.append(suite_dict)

            logger.info(
                f"Retrieved {len(result)} test suites with case previews for flow {flow_id}"  # noqa
            )
            return result
        except Exception as e:
            logger.error(
                f"Error retrieving test suites with case previews for flow {flow_id}: {e}"  # noqa
            )
            self.db_session.rollback()
            raise e

    def get_test_case_run_status(self, task_run_id: str) -> str:
        """
        Get the status of a test case run by its ID.

        Args:
            task_run_id: The ID of the test case run

        Returns:
            str: The status of the test case run

        Raises:
            NoResultFound: If test case run with given ID is not found
        """
        try:
            test_case_run = (
                self.db_session.query(FlowTestCaseRunModel)
                .filter_by(task_run_id=task_run_id)
                .one_or_none()
            )

            if not test_case_run:
                logger.warning(f"Test case run with ID: {task_run_id} not found.")
                raise NoResultFound(f"Test case run with ID {task_run_id} not found.")

            status = str(test_case_run.status)
            logger.info(
                f"Retrieved status '{status}' for test case run with ID: {task_run_id}"
            )
            return status

        except NoResultFound as e:
            logger.error(
                f"NoResultFound error when getting status for test case run with ID {task_run_id}: {e}"
            )
            raise e
        except Exception as e:
            logger.error(
                f"Error getting status for test case run with ID {task_run_id}: {e}"
            )
            self.db_session.rollback()
            raise e

    def queue_a_test_case_run(self, test_case_id: int, task_run_id: str) -> None:
        """
        Create new TestCaseRunModel and set status to QUEUED
        """
        try:
            test_case_run = FlowTestCaseRunModel(
                task_run_id=task_run_id,
                test_case_id=test_case_id,
                status=TestCaseRunStatus.QUEUED,
            )
            self.db_session.add(test_case_run)
            self.db_session.commit()
            logger.info(
                f"Successfully queued test case with ID {test_case_id} for execution"
            )
        except Exception as e:
            logger.error(
                f"Error queuing test case with ID {test_case_id} for execution: {str(e)}"
            )
            raise

    def set_test_case_run_status(self, task_run_id: str, status: str) -> None:
        """
        Set the status of a test case run by its ID.

        Args:
            case_id: The ID of the test case run
            status: The status of the test case run

        Raises:
            NoResultFound: If test case run with given ID is not found
        """
        try:
            test_case_run = (
                self.db_session.query(FlowTestCaseRunModel)
                .filter_by(task_run_id=task_run_id)
                .one_or_none()
            )

            if not test_case_run:
                logger.warning(
                    f"Test case run with task_run ID: {task_run_id} not found."
                )
                raise NoResultFound(
                    f"Test case run with task_run ID {task_run_id} not found."
                )

            test_case_run.status = status
            self.db_session.commit()
            logger.info(
                f"Updated status to '{status}' for test case run with task_run ID: {task_run_id}"
            )

        except NoResultFound as e:
            logger.error(
                f"NoResultFound error when setting status for test case run with task_run ID {task_run_id}: {e}"
            )
            raise e
        except Exception as e:
            logger.error(
                f"Error setting status for test case run with task_run ID {task_run_id}: {e}"
            )
            self.db_session.rollback()
            raise e
