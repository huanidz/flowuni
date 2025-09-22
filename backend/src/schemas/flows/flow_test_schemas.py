from typing import List, Optional

from pydantic import BaseModel, Field


class TestSuiteCreateRequest(BaseModel):
    """
    Request model for creating a test suite
    """

    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")


class TestSuiteCreateResponse(BaseModel):
    """
    Response model for test suite creation
    """

    id: int = Field(..., description="Test suite ID")
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    is_active: bool = Field(True, description="Test suite status")
