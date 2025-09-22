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


class TestCaseResponse(BaseModel):
    """
    Response model for test case
    """

    id: int = Field(..., description="Test case ID")
    case_id: int = Field(..., description="Test case unique ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")
    input_data: Optional[dict] = Field(None, description="Test case input data")
    expected_output: Optional[dict] = Field(
        None, description="Test case expected output"
    )
    test_metadata: Optional[dict] = Field(None, description="Test case metadata")
    run_detail: Optional[dict] = Field(None, description="Test run details")
    timeout_ms: Optional[float] = Field(
        None, description="Test case timeout in milliseconds"
    )
    status: Optional[str] = Field(None, description="Test case execution status")
    actual_output: Optional[dict] = Field(None, description="Test case actual output")
    error_message: Optional[str] = Field(None, description="Test case error message")
    execution_time_ms: Optional[float] = Field(
        None, description="Test case execution time in milliseconds"
    )


class TestSuiteWithCasesResponse(BaseModel):
    """
    Response model for test suite with test cases
    """

    id: int = Field(..., description="Test suite ID")
    suite_id: int = Field(..., description="Test suite unique ID")
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    is_active: bool = Field(True, description="Test suite status")
    suite_metadata: Optional[dict] = Field(None, description="Test suite metadata")
    test_cases: List[TestCaseResponse] = Field(
        default_factory=list, description="List of test cases in the suite"
    )


class TestCaseCreateRequest(BaseModel):
    """
    Request model for creating a test case
    """

    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    input_data: Optional[dict] = Field(None, description="Test case input data")
    expected_output: Optional[dict] = Field(
        None, description="Test case expected output"
    )
    test_metadata: Optional[dict] = Field(None, description="Test case metadata")
    run_detail: Optional[dict] = Field(None, description="Test run details")
    timeout_ms: Optional[float] = Field(
        None, description="Test case timeout in milliseconds"
    )


class TestCaseUpdateRequest(BaseModel):
    """
    Request model for updating a test case
    """

    name: Optional[str] = Field(None, description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: Optional[bool] = Field(None, description="Test case status")
    input_data: Optional[dict] = Field(None, description="Test case input data")
    expected_output: Optional[dict] = Field(
        None, description="Test case expected output"
    )
    test_metadata: Optional[dict] = Field(None, description="Test case metadata")
    run_detail: Optional[dict] = Field(None, description="Test run details")
    timeout_ms: Optional[float] = Field(
        None, description="Test case timeout in milliseconds"
    )
    status: Optional[str] = Field(None, description="Test case execution status")
    actual_output: Optional[dict] = Field(None, description="Test case actual output")
    error_message: Optional[str] = Field(None, description="Test case error message")
    execution_time_ms: Optional[float] = Field(
        None, description="Test case execution time in milliseconds"
    )
