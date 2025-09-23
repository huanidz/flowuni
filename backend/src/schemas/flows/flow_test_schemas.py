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


class TestCaseCreateResponse(BaseModel):
    """
    Response model for test case creation
    """

    id: int = Field(..., description="Test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")


class TestCaseGetResponse(BaseModel):
    """
    Response model for getting a test case
    """

    id: int = Field(..., description="Test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: Optional[bool] = Field(True, description="Test case status")
    input_text: Optional[str] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[Dict[str, Any]] = Field(None, description="Pass criteria")
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")


class TestCasePreview(BaseModel):
    """
    Preview model for test case with limited fields
    """

    id: int = Field(..., description="Test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")


class TestSuiteWithCasePreviews(BaseModel):
    """
    Response model for test suite with case previews
    """

    id: int = Field(..., description="Test suite ID")
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    is_active: bool = Field(True, description="Test suite status")
    test_cases: list[TestCasePreview] = Field(
        [], description="List of test case previews"
    )


class TestSuitesWithCasePreviewsResponse(BaseModel):
    """
    Response model for getting all test suites with case previews
    """

    test_suites: list[TestSuiteWithCasePreviews] = Field(
        [], description="List of test suites with case previews"
    )


class TestCaseUpdateRequest(BaseModel):
    """
    Request model for updating a test case (full update with PUT)
    """

    suite_id: Optional[int] = Field(None, description="Test suite ID")
    name: Optional[str] = Field(None, description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: Optional[bool] = Field(None, description="Test case status")
    input_text: Optional[str] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[Dict[str, Any]] = Field(None, description="Pass criteria")
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")


class TestCasePartialUpdateRequest(BaseModel):
    """
    Request model for partially updating a test case (with PATCH)
    """

    suite_id: Optional[int] = Field(None, description="Test suite ID")
    name: Optional[str] = Field(None, description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: Optional[bool] = Field(None, description="Test case status")
    input_text: Optional[str] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[Dict[str, Any]] = Field(None, description="Pass criteria")
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")


class TestCaseUpdateResponse(BaseModel):
    """
    Response model for test case update
    """

    id: int = Field(..., description="Test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")
    input_text: Optional[str] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[Dict[str, Any]] = Field(None, description="Pass criteria")
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")
