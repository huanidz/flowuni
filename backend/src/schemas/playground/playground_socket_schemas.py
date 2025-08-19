from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PlaygroundMessageType(str, Enum):
    CHAT = "chat"
    SYSTEM = "system"
    TYPING = "typing"
    ERROR = "error"


class PlaygroundWebSocketMessage(BaseModel):
    type: PlaygroundMessageType
    content: str = Field(..., max_length=1000)
    user_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = {}


class PlaygroundWebSocketResponse(BaseModel):
    type: PlaygroundMessageType
    content: str
    user_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class ConnectionInfo(BaseModel):
    user_id: str
    connected_at: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    type: PlaygroundMessageType = PlaygroundMessageType.ERROR
    error: str
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
