from typing import Optional

from loguru import logger
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
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
