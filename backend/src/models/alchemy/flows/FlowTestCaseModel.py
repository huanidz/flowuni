# Note: The id (primary key) of this model is declared at AppBaseModel.
# This id is treated as database-level unique. All kind of id currently defined
# is for app logic which may looks confusing at first but it does serve a purpose.

from fastnanoid import generate
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


def generate_test_case_nanoid() -> str:
    return f"C-{generate(size=16)}"


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
    simple_id = Column(String, nullable=True, default=generate_test_case_nanoid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)  # Un-used field for now

    # test case data
    input_text = Column(Text, nullable=True)
    input_metadata = Column(JSONB, nullable=True)  # Prepare for future image input.

    # Criteria (List of json object that will be validate with Pydantic for flexible expansion) # noqa
    pass_criteria = Column(JSONB, nullable=True)

    # execution control
    timeout_ms = Column(
        Float, nullable=True, default=300
    )  # Upper-bound (TODO: Use in future)

    # relationships
    test_suite = relationship("FlowTestSuiteModel", back_populates="test_cases")

    runs = relationship(
        "FlowTestCaseRunModel",
        back_populates="test_case",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return (
            f"<FlowTestCaseModel(id={self.id}, case_id={self.case_id}, "
            f"name={self.name}, suite_id={self.suite_id}, status={self.status})>"
        )
