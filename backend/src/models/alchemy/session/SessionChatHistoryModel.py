# SessionChatHistoryModel.py
# Note: The id (primary key) of this model is declared at AppBaseModel.
# This id is treated as database-level unique. All kind of id currently defined
# is for app logic which may looks confusing at first but it does serve a purpose.

from sqlalchemy import Column, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class SessionChatHistoryModel(AppBaseModel):
    __tablename__ = "sessions_chat_histories"

    session_id = Column(
        String,
        ForeignKey("sessions.user_defined_session_id"),
        nullable=False,
        index=True,
    )
    role = Column(
        Enum("user", "assistant", name="sender_type"), nullable=False, index=True
    )
    message = Column(Text, nullable=False)
    chat_metadata = Column(JSONB, nullable=True)

    session = relationship("SessionModel", back_populates="chat_histories", lazy=True)

    __table_args__ = (
        Index("idx_chat_histories_session_id", "session_id"),
        Index("idx_chat_histories_role", "role"),
    )
