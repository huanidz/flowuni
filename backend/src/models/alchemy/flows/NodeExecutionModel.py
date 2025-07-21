from enum import Enum

from sqlalchemy import Column, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class NodeExecutionStatus(Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class NodeExecutionModel(AppBaseModel):
    """
    Node execution model
    """

    __tablename__ = "node_executions"

    node_id = Column(String, nullable=False)
    flow_execution_id = Column(String, nullable=False)

    node_id = Column(String, nullable=False)
    status = Column(
        SQLEnum(NodeExecutionStatus, name="node_execution_status"),
        nullable=False,
        default=NodeExecutionStatus.PENDING,
    )

    output_data = Column(JSONB, nullable=True)
