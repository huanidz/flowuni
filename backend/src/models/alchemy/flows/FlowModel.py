from sqlalchemy import Boolean, Column, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class FlowModel(AppBaseModel):
    """
    Flow model
    """

    __tablename__ = "flows"

    flow_id = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    flow_definition = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=False)
    flow_executions = relationship("FlowExecutionModel", back_populates="flow")
