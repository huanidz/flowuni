# SessionModel.py
# Note: The id (primary key) of this model is declared at AppBaseModel.
# This id is treated as database-level unique. All kind of id currently defined
# is for app logic which may looks confusing at first but it does serve a purpose.

from sqlalchemy import Boolean, Column, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class SessionModel(AppBaseModel):
    __tablename__ = "sessions"

    flow_id = Column(
        String(64),
        ForeignKey("flows.flow_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    user_defined_session_id = Column(String, index=True)
    session_metadata = Column(JSONB, nullable=True)

    is_playground = Column(Boolean, default=False, nullable=False)

    chat_histories = relationship(
        "SessionChatHistoryModel",
        back_populates="session",
        lazy=True,
        cascade="all, delete-orphan",
    )
    flow = relationship("FlowModel", back_populates="sessions")

    __table_args__ = (
        Index("idx_sessions_flow_id", "flow_id"),
        Index("idx_sessions_user_defined_session_id", "user_defined_session_id"),
    )
