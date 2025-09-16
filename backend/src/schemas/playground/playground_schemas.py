from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# --- Session Schemas ---


class CreatePlaygroundSessionRequest(BaseModel):
    """Request schema for creating a playground session"""

    flow_id: str = Field(..., description="Flow ID to associate with the session")
    session_metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional metadata for the session"
    )


class PlaygroundSessionResponse(BaseModel):
    """Response schema for playground session data"""

    user_defined_session_id: str = Field(..., description="Session ID")
    flow_id: str = Field(..., description="Associated flow ID")
    session_metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Session metadata"
    )
    is_playground: bool = Field(
        True, description="Whether this is a playground session"
    )
    created_at: str = Field(..., description="Creation timestamp")
    modified_at: str = Field(..., description="Last modification timestamp")


class GetPlaygroundSessionsRequest(BaseModel):
    """Request schema for getting playground sessions"""

    flow_id: str = Field(..., description="Flow ID")
    page: int = Field(1, description="Page number")
    per_page: int = Field(10, description="Number of items per page")


class Pagination(BaseModel):
    """Pagination metadata"""

    page: int = Field(..., description="Page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    total_items: int = Field(..., description="Total number of items")


class GetPlaygroundSessionsResponse(BaseModel):
    """Response schema for getting playground sessions"""

    data: List[PlaygroundSessionResponse] = Field(
        ..., description="List of playground sessions"
    )
    pagination: Pagination = Field(..., description="Pagination metadata")


# --- Chat History Schemas ---


class AddChatMessageRequest(BaseModel):
    """Request schema for adding a chat message to a session"""

    session_id: str = Field(..., description="Session ID")
    role: str = Field(..., description="Message role (user or assistant)")
    message: str = Field(..., description="Message content")
    chat_metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional metadata for the message"
    )


class ChatMessageResponse(BaseModel):
    """Response schema for a chat message"""

    id: str = Field(..., description="Message ID")
    session_id: str = Field(..., description="Session ID")
    role: str = Field(..., description="Message role (user or assistant)")
    message: str = Field(..., description="Message content")
    chat_metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Message metadata"
    )
    created_at: str = Field(..., description="Creation timestamp")


class GetChatHistoryRequest(BaseModel):
    """Request schema for getting chat history"""

    session_id: str = Field(..., description="Session ID")
    num_messages: Optional[int] = Field(
        default=None, description="Number of latest messages to retrieve (None for all)"
    )


class GetChatHistoryResponse(BaseModel):
    """Response schema for getting chat history"""

    session_id: str = Field(..., description="Session ID")
    messages: List[ChatMessageResponse] = Field(
        ..., description="List of chat messages"
    )


# --- Update Session Schemas ---


class UpdateSessionMetadataRequest(BaseModel):
    """Request schema for updating session metadata"""

    session_id: str = Field(..., description="Session ID")
    metadata: Dict[str, Any] = Field(..., description="New metadata for the session")


class UpdateSessionMetadataResponse(BaseModel):
    """Response schema for updating session metadata"""

    user_defined_session_id: str = Field(..., description="Session ID")
    flow_id: str = Field(..., description="Associated flow ID")
    session_metadata: Dict[str, Any] = Field(
        ..., description="Updated session metadata"
    )
    is_playground: bool = Field(
        True, description="Whether this is a playground session"
    )
    created_at: str = Field(..., description="Creation timestamp")
    modified_at: str = Field(..., description="Last modification timestamp")
