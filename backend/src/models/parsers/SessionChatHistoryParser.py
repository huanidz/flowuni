from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel
from src.components.llm.models.core import ChatMessage


class SessionChatHistoryParser(BaseModel):
    """Parser for session chat history."""

    role: Literal["user", "assistant"]  # 'user' or 'assistant'
    message: str
    created_at: datetime
    chat_metadata: Optional[Dict[str, Any]] = None

    class Config:
        # allow validation from ORM objects
        from_attributes = True
        extra = "allow"


class SessionChatHistoryListParser(BaseModel):
    """Parser for session chat history."""

    session_id: str
    chat_histories: List[SessionChatHistoryParser] = []

    class Config:
        # allow validation from ORM objects
        from_attributes = True

    def to_chat_messages(self) -> List[ChatMessage]:
        chat_messages = []
        for chat_history in self.chat_histories:
            chat_message = ChatMessage(
                role=chat_history.role, content=chat_history.message
            )
            chat_messages.append(chat_message)
        return chat_messages
