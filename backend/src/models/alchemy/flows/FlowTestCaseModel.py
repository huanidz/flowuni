from enum import Enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class TestCaseStatus(Enum):
    """
    Enumeration for test case execution status.
    """

    PENDING = "PENDING"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    CANCEL = "CANCEL"


class FlowTestCaseModel(AppBaseModel):
    """
    Flow test case model for individual test scenarios within a test suite.

    A test case represents a specific scenario to validate flow functionality,
    including input data, expected outputs, and execution results.
    """

    __tablename__ = "flow_test_cases"

    suite_id = Column(
        BigInteger,
        ForeignKey("flow_test_suites.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    # test case data
    input_data = Column(JSONB, nullable=True)
    expected_output = Column(JSONB, nullable=True)
    test_metadata = Column(JSONB, nullable=True)
    run_detail = Column(JSONB, nullable=True)

    # execution control
    timeout_ms = Column(Float, nullable=True, default=300)

    # execution results
    status = Column(
        SQLEnum(TestCaseStatus, name="test_case_status"),
        nullable=True,
        default=TestCaseStatus.PENDING,
    )
    actual_output = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    execution_time_ms = Column(Float, nullable=True)

    # relationships
    test_suite = relationship("FlowTestSuiteModel", back_populates="test_cases")

    def __repr__(self) -> str:
        return (
            f"<FlowTestCaseModel(id={self.id}, case_id={self.case_id}, "
            f"name={self.name}, suite_id={self.suite_id}, status={self.status})>"
        )
