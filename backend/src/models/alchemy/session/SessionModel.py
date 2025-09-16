# SessionModel.py
from sqlalchemy import Column, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class SessionModel(AppBaseModel):
    __tablename__ = "sessions"

    flow_id = Column(String(64), nullable=True, index=True)
    session_metadata = Column(JSONB, nullable=True)

    chat_histories = relationship(
        "SessionChatHistoryModel",
        back_populates="session",
        lazy=True,
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("idx_sessions_flow_id", "flow_id"),)
