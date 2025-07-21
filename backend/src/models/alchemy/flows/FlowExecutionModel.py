from enum import Enum

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class FlowExecutionStatus(Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class FlowExecutionModel(AppBaseModel):
    """
    Flow execution model
    """

    __tablename__ = "flow_executions"

    flow_id = Column(String, ForeignKey("flows.flow_id"), nullable=False)
    status = Column(
        SQLEnum(FlowExecutionStatus, name="flow_execution_status"),
        nullable=False,
        default=FlowExecutionStatus.PENDING,
    )

    flow = relationship("FlowModel", back_populates="flow_executions")

    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
