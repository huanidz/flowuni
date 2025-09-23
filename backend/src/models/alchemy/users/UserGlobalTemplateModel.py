# Note: The id (primary key) of this model is declared at AppBaseModel.
# This id is treated as database-level unique. All kind of id currently defined
# is for app logic which may looks confusing at first but it does serve a purpose.

from enum import Enum

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class TemplateType(Enum):
    """Template type enumeration"""

    LLM_JUDGE = "llm_judge"
    OTHER = "other"


class UserGlobalTemplateModel(AppBaseModel):
    """
    User Global Template model

    Stores user-defined templates that can be reused across flows.
    One user can have many templates (1-N relationship).
    """

    __tablename__ = "user_global_templates"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(
        SQLEnum(TemplateType, name="user_template_type"),
        nullable=False,
        default=TemplateType.OTHER,
    )
    data = Column(JSONB, nullable=True)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)

    # Relationships
    user = relationship("UserModel", back_populates="global_templates")

    def __repr__(self):
        return f"<UserGlobalTemplateModel(id={self.id}, user_id={self.user_id}, type={self.type}, name={self.name})>"  # noqa: E501
