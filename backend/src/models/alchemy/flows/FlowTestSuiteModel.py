# Note: The id (primary key) of this model is declared at AppBaseModel.
# This id is treated as database-level unique. All kind of id currently defined
# is for app logic which may looks confusing at first but it does serve a purpose.

from fastnanoid import generate
from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


def generate_suite_nanoid():
    return f"S-{generate(size=16)}"


class FlowTestSuiteModel(AppBaseModel):
    """
    Flow test suite model for organizing test cases within a flow.

    A test suite represents a collection of test cases that can be executed
    together to validate different aspects of a flow's functionality.
    """

    __tablename__ = "flow_test_suites"

    flow_id = Column(
        String, ForeignKey("flows.flow_id", ondelete="CASCADE"), nullable=False
    )
    simple_id = Column(String, nullable=True, default=generate_suite_nanoid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    suite_metadata = Column(JSONB, nullable=True)

    # relationships
    flow = relationship("FlowModel", back_populates="test_suites")
    test_cases = relationship(
        "FlowTestCaseModel",
        back_populates="test_suite",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<FlowTestSuiteModel(id={self.id}, suite_id={self.suite_id}, "
            f"name={self.name}, flow_id={self.flow_id}, is_active={self.is_active})>"
        )
