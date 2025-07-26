from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class FlowModel(AppBaseModel):
    """
    Flow model
    """

    __tablename__ = "flows"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flow_id = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    flow_definition = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=False)
    flow_executions = relationship("FlowExecutionModel", back_populates="flow")
    user = relationship("UserModel", back_populates="flows")

    def __repr__(self):
        return f"<FlowModel(flow_id={self.flow_id}, name={self.name}, description={self.description}, is_active={self.is_active})>"
