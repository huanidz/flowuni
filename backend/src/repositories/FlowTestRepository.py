from datetime import datetime
from typing import Any, Dict, Optional

from loguru import logger
from sqlalchemy import and_, desc, func
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
        Get all test suites for a flow with case previews + latest run status.
        Single round-trip for suites, single round-trip for cases+runs.
        """
        try:
            s = self.db_session

            # 1) Fetch suites (only fields we need)
            suites = (
                s.query(
                    FlowTestSuiteModel.id,
                    FlowTestSuiteModel.simple_id,
                    FlowTestSuiteModel.flow_id,
                    FlowTestSuiteModel.name,
                    FlowTestSuiteModel.description,
                    FlowTestSuiteModel.is_active,
                )
                .filter(FlowTestSuiteModel.flow_id == flow_id)
                .all()
            )

            if not suites:
                logger.info(f"Retrieved 0 test suites for flow {flow_id}")
                return []

            suite_ids = [row.id for row in suites]

            # 2) Build a subquery that picks the latest run per test_case using a window function
            #    ROW_NUMBER() OVER (PARTITION BY test_case_id ORDER BY created_at DESC) = 1
            latest_runs_sq = s.query(
                FlowTestCaseRunModel.test_case_id.label("case_id"),
                FlowTestCaseRunModel.id.label("run_id"),
                FlowTestCaseRunModel.task_run_id.label("task_run_id"),
                FlowTestCaseRunModel.status.label("latest_status"),
                FlowTestCaseRunModel.actual_output.label("actual_output"),
                FlowTestCaseRunModel.error_message.label("error_message"),
                FlowTestCaseRunModel.execution_time_ms.label("execution_time_ms"),
                FlowTestCaseRunModel.run_detail.label("run_detail"),
                FlowTestCaseRunModel.criteria_results.label("criteria_results"),
                FlowTestCaseRunModel.trigger_type.label("trigger_type"),
                FlowTestCaseRunModel.triggered_by.label("triggered_by"),
                FlowTestCaseRunModel.started_at.label("started_at"),
                FlowTestCaseRunModel.finished_at.label("finished_at"),
                FlowTestCaseRunModel.created_at.label("created_at"),
                func.row_number()
                .over(
                    partition_by=FlowTestCaseRunModel.test_case_id,
                    order_by=FlowTestCaseRunModel.created_at.desc(),
                )
                .label("rn"),
            ).subquery("latest_runs_sq")

            # 3) Fetch all cases for all suites in one go, left-joining the "rn=1" row for latest status
            #    Note: put rn=1 in the join condition to keep it an OUTER join.
            cases_rows = (
                s.query(
                    FlowTestCaseModel.id.label("id"),
                    FlowTestCaseModel.simple_id.label("simple_id"),
                    FlowTestCaseModel.suite_id.label("suite_id"),
                    FlowTestCaseModel.name.label("name"),
                    FlowTestCaseModel.description.label("description"),
                    FlowTestCaseModel.is_active.label("is_active"),
                    latest_runs_sq.c.latest_status.label("latest_run_status"),
                    latest_runs_sq.c.run_id.label("latest_run_id"),
                    latest_runs_sq.c.task_run_id.label("latest_run_task_run_id"),
                    latest_runs_sq.c.actual_output.label("latest_run_actual_output"),
                    latest_runs_sq.c.error_message.label("latest_run_error_message"),
                    latest_runs_sq.c.execution_time_ms.label(
                        "latest_run_execution_time_ms"
                    ),
                    latest_runs_sq.c.run_detail.label("latest_run_run_detail"),
                    latest_runs_sq.c.criteria_results.label(
                        "latest_run_criteria_results"
                    ),
                    latest_runs_sq.c.trigger_type.label("latest_run_trigger_type"),
                    latest_runs_sq.c.triggered_by.label("latest_run_triggered_by"),
                    latest_runs_sq.c.started_at.label("latest_run_started_at"),
                    latest_runs_sq.c.finished_at.label("latest_run_finished_at"),
                    latest_runs_sq.c.created_at.label("latest_run_created_at"),
                )
                .filter(FlowTestCaseModel.suite_id.in_(suite_ids))
                .outerjoin(
                    latest_runs_sq,
                    and_(
                        latest_runs_sq.c.case_id == FlowTestCaseModel.id,
                        latest_runs_sq.c.rn == 1,
                    ),
                )
                .order_by(FlowTestCaseModel.id)  # Consistent ordering by ID
                .all()
            )

            # 4) Group cases by suite_id
            cases_by_suite = {}
            for r in cases_rows:
                latest_run = None
                if r.latest_run_id:
                    latest_run = {
                        "id": r.latest_run_id,
                        "test_case_id": r.id,
                        "task_run_id": r.latest_run_task_run_id,
                        "status": r.latest_run_status,
                        "actual_output": r.latest_run_actual_output,
                        "error_message": r.latest_run_error_message,
                        "execution_time_ms": r.latest_run_execution_time_ms,
                        "run_detail": r.latest_run_run_detail,
                        "criteria_results": r.latest_run_criteria_results,
                        "trigger_type": r.latest_run_trigger_type,
                        "triggered_by": r.latest_run_triggered_by,
                        "started_at": r.latest_run_started_at,
                        "finished_at": r.latest_run_finished_at,
                    }

                cases_by_suite.setdefault(r.suite_id, []).append(
                    {
                        "id": r.id,
                        "simple_id": r.simple_id,
                        "suite_id": r.suite_id,
                        "name": r.name,
                        "description": r.description,
                        "is_active": r.is_active,
                        # Ensure the field is always present (None if no runs yet)
                        "latest_run_status": r.latest_run_status,
                        "latest_run_error_message": r.latest_run_error_message,
                        "latest_run_chat_output": r.latest_run_actual_output.get(
                            "chat_output"
                        ),
                    }
                )

            # 5) Assemble final structure
            result = []
            for suite in suites:
                result.append(
                    {
                        "id": suite.id,
                        "simple_id": suite.simple_id,
                        "flow_id": suite.flow_id,
                        "name": suite.name,
                        "description": suite.description,
                        "is_active": suite.is_active,
                        "test_cases": cases_by_suite.get(suite.id, []),
                    }
                )

            logger.info(
                f"Retrieved {len(result)} test suites with case previews for flow {flow_id}"
            )
            return result

        except Exception as e:
            logger.error(
                f"Error retrieving test suites with case previews for flow {flow_id}: {e}"
            )
            self.db_session.rollback()
            raise

    def get_test_case_run_status(self, task_run_id: str) -> Optional[str]:
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
            status = str(test_case_run.status)
            logger.info(
                f"Retrieved status '{status}' for test case run with ID: {task_run_id}"
            )
            return status

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

    def update_test_case_run(  # noqa
        self,
        run_id: int,  # Task_Run_ID
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
        Update a test case run by its Task_Run_ID.

        Args:
            run_id: Test case run Task_Run_ID to update
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

        Raises:
            NoResultFound: If test case run with given ID is not found
        """
        try:
            # Get the test case run to update
            test_case_run = (
                self.db_session.query(FlowTestCaseRunModel)
                .filter_by(task_run_id=run_id)
                .first()
            )
            if not test_case_run:
                logger.warning(
                    f"Attempted to update non-existent test case run with Task_Run_ID: {run_id}"
                )
                raise NoResultFound(
                    f"Test case run with Task_Run_ID {run_id} not found."
                )

            # Update fields if provided
            if status is not None:
                test_case_run.status = status
            if actual_output is not None:
                test_case_run.actual_output = actual_output
            if error_message is not None:
                test_case_run.error_message = error_message
            if execution_time_ms is not None:
                test_case_run.execution_time_ms = execution_time_ms
            if run_detail is not None:
                test_case_run.run_detail = run_detail
            if criteria_results is not None:
                test_case_run.criteria_results = criteria_results
            if started_at is not None:
                test_case_run.started_at = started_at
            if finished_at is not None:
                test_case_run.finished_at = finished_at

            self.db_session.commit()
            self.db_session.refresh(test_case_run)
            logger.info(f"Updated test case run with Task_Run_ID: {run_id}")
            return test_case_run

        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when updating test case run with Task_Run_ID {run_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error updating test case run with Task_Run_ID {run_id}: {e}")
            raise e

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

            # Query to get the latest run for each test case
            # Subquery to get the latest created_at for each test case
            latest_run_subquery = (
                self.db_session.query(
                    FlowTestCaseRunModel.test_case_id,
                    func.max(FlowTestCaseRunModel.created_at).label("max_created_at"),
                )
                .filter(FlowTestCaseRunModel.test_case_id.in_(test_case_ids))
                .group_by(FlowTestCaseRunModel.test_case_id)
                .subquery("latest_run_subquery")
            )

            # Query to get the status of the latest run for each test case
            latest_run_query = (
                self.db_session.query(
                    FlowTestCaseRunModel.test_case_id,
                    FlowTestCaseRunModel.status,
                )
                .join(
                    latest_run_subquery,
                    (
                        FlowTestCaseRunModel.test_case_id
                        == latest_run_subquery.c.test_case_id
                    )
                    & (
                        FlowTestCaseRunModel.created_at
                        == latest_run_subquery.c.max_created_at
                    ),
                )
                .all()
            )

            # Create a dictionary mapping test_case_id to its latest run status
            result = dict.fromkeys(test_case_ids, TestCaseRunStatus.PENDING)

            # Update with actual statuses for test cases that have runs
            for test_case_id, status in latest_run_query:
                result[test_case_id] = str(status)

            logger.info(
                f"Retrieved latest run statuses for {len(test_case_ids)} test cases"
            )
            return result

        except Exception as e:
            logger.error(f"Error getting latest run statuses for test cases: {e}")
            self.db_session.rollback()
            raise e

    def get_latest_test_case_run_status(self, test_case_id: int) -> Optional[str]:
        """
        Get the status of the latest test case run for a given test case ID.

        Args:
            test_case_id: The ID of the test case

        Returns:
            str: The status of the latest test case run, or PENDING if no runs exist
        """
        try:
            # Query to get the latest run for the test case
            latest_run = (
                self.db_session.query(FlowTestCaseRunModel)
                .filter_by(test_case_id=test_case_id)
                .order_by(desc(FlowTestCaseRunModel.created_at))
                .first()
            )

            if latest_run:
                status = str(latest_run.status)
                logger.info(
                    f"Retrieved status '{status}' for latest run of test case with ID: {test_case_id}"
                )
                return status
            else:
                logger.info(
                    f"No test case runs found for test case with ID: {test_case_id}, returning PENDING"
                )
                return TestCaseRunStatus.PENDING.value

        except Exception as e:
            logger.error(
                f"Error getting latest run status for test case with ID {test_case_id}: {e}"
            )
            self.db_session.rollback()
            raise e

    def get_test_case_run_by_task_id(
        self, task_run_id: str
    ) -> Optional[FlowTestCaseRunModel]:
        """
        Get a test case run by its task run ID.

        Args:
            task_run_id: The task run ID of the test case run

        Returns:
            FlowTestCaseRunModel: The test case run model, or None if not found
        """
        try:
            test_case_run = (
                self.db_session.query(FlowTestCaseRunModel)
                .filter_by(task_run_id=task_run_id)
                .one_or_none()
            )
            if test_case_run:
                logger.info(f"Retrieved test case run with task_run_id: {task_run_id}")
            else:
                logger.info(f"Test case run with task_run_id: {task_run_id} not found.")
            return test_case_run
        except Exception as e:
            logger.error(
                f"Error retrieving test case run by task_run_id {task_run_id}: {e}"
            )
            self.db_session.rollback()
            raise e
