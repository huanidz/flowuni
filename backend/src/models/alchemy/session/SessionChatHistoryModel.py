# SessionChatHistoryModel.py
from sqlalchemy import BigInteger, Column, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class SessionChatHistoryModel(AppBaseModel):
    __tablename__ = "sessions_chat_histories"

    session_id = Column(
        BigInteger, ForeignKey("sessions.id"), nullable=False, index=True
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
