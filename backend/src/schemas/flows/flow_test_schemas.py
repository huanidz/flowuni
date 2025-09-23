from typing import Any, Dict, Optional

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


class TestCaseCreateRequest(BaseModel):
    """
    Request model for creating a test case
    """

    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    desc: Optional[str] = Field(None, description="Test case description")
    flow_definition: Optional[Dict[str, Any]] = Field(
        None, description="Flow definition"
    )


class TestCaseCreateResponse(BaseModel):
    """
    Response model for test case creation
    """

    id: int = Field(..., description="Test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")
    flow_definition: Optional[Dict[str, Any]] = Field(
        None, description="Flow definition"
    )


class TestCaseGetResponse(BaseModel):
    """
    Response model for getting a test case
    """

    id: int = Field(..., description="Test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")
    flow_definition: Optional[Dict[str, Any]] = Field(
        None, description="Flow definition"
    )
    input_data: Optional[Dict[str, Any]] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[Dict[str, Any]] = Field(None, description="Pass criteria")
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")
