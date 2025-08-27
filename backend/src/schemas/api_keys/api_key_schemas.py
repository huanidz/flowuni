from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CreateApiKeyRequest(BaseModel):
    """
    Request schema for creating a new API key
    """

    name: str
    description: Optional[str] = None
    expires_at: Optional[datetime] = None


class ApiKeyResponse(BaseModel):
    """
    Response schema for API key creation (includes the actual key)
    """

    key_id: str
    name: str
    description: Optional[str]
    key: str  # The actual API key - only returned on creation
    created_at: datetime
    expires_at: Optional[datetime] = None


class ApiKeyInfoResponse(BaseModel):
    """
    Response schema for API key information (without the actual key)
    """

    key_id: str
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None


class ValidateApiKeyRequest(BaseModel):
    """
    Request schema for validating an API key
    """

    api_key: str


class ValidateApiKeyResponse(BaseModel):
    """
    Response schema for API key validation
    """

    valid: bool
    user_id: Optional[int] = None
    key_id: Optional[str] = None
    name: Optional[str] = None


class ApiKeyListResponse(BaseModel):
    """
    Response schema for listing API keys
    """

    api_keys: list[ApiKeyInfoResponse]
