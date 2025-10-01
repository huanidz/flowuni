from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from src.models.validators.PassCriteriaValidator import PassCriteriaValidator


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
    simple_id: str = Field(..., description="Simple test suite ID")
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    is_active: bool = Field(True, description="Test suite status")


class TestSuiteUpdateRequest(BaseModel):
    """
    Request model for updating a test suite (full update with PUT)
    """

    flow_id: Optional[str] = Field(None, description="Flow ID")
    name: Optional[str] = Field(None, description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    is_active: Optional[bool] = Field(None, description="Test suite status")


class TestSuitePartialUpdateRequest(BaseModel):
    """
    Request model for partially updating a test suite (with PATCH)
    """

    flow_id: Optional[str] = Field(None, description="Flow ID")
    name: Optional[str] = Field(None, description="Test suite name")
    description: Optional[str] = Field(None, description="Test suite description")
    is_active: Optional[bool] = Field(None, description="Test suite status")


class TestSuiteUpdateResponse(BaseModel):
    """
    Response model for test suite update
    """

    id: int = Field(..., description="Test suite ID")
    simple_id: str = Field(..., description="Simple test suite ID")
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
    simple_id: str = Field(..., description="Simple test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")


class TestCaseGetResponse(BaseModel):
    """
    Response model for getting a test case
    """

    id: int = Field(..., description="Test case ID")
    simple_id: str = Field(..., description="Simple test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: Optional[bool] = Field(True, description="Test case status")
    input_text: Optional[str] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[PassCriteriaValidator] = Field(
        None, description="Pass criteria"
    )
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")


class TestCasePreview(BaseModel):
    """
    Preview model for test case with limited fields
    """

    id: int = Field(..., description="Test case ID")
    simple_id: str = Field(..., description="Simple test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")
    latest_run_status: Optional[str] = Field(
        None, description="Latest test case run status"
    )
    latest_run_error_message: Optional[str] = Field(
        None, description="Latest test case run error message"
    )
    latest_run_chat_output: Optional[Dict[str, Any]] = Field(
        None, description="Latest test case run chat output"
    )


class TestSuiteWithCasePreviews(BaseModel):
    """
    Response model for test suite with case previews
    """

    id: int = Field(..., description="Test suite ID")
    simple_id: str = Field(..., description="Simple test case ID")
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
    pass_criteria: Optional[PassCriteriaValidator] = Field(
        None, description="Pass criteria"
    )
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
    pass_criteria: Optional[PassCriteriaValidator] = Field(
        None, description="Pass criteria"
    )
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")


class TestCaseUpdateResponse(BaseModel):
    """
    Response model for test case update
    """

    id: int = Field(..., description="Test case ID")
    simple_id: str = Field(..., description="Simple test case ID")
    suite_id: int = Field(..., description="Test suite ID")
    name: str = Field(..., description="Test case name")
    description: Optional[str] = Field(None, description="Test case description")
    is_active: bool = Field(True, description="Test case status")
    input_text: Optional[str] = Field(None, description="Input data")
    input_metadata: Optional[Dict[str, Any]] = Field(None, description="Input metadata")
    pass_criteria: Optional[PassCriteriaValidator] = Field(
        None, description="Pass criteria"
    )
    timeout_ms: Optional[float] = Field(None, description="Timeout in milliseconds")


class FlowTestRunRequest(BaseModel):
    """
    Request model for running a flow test
    """

    case_id: int = Field(..., description="Test case ID")
    flow_id: str = Field(..., description="Flow ID")


class FlowBatchTestRunRequest(BaseModel):
    """
    Request model for running a batch of flow tests
    """

    case_ids: List[int] = Field(..., description="List of test case IDs")
    flow_id: str = Field(..., description="Flow ID")
    input_text: Optional[str] = Field(None, description="Input text for the test")
    input_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Input metadata for the test"
    )


class FlowBatchTestRunResponse(BaseModel):
    """
    Response model for batch flow test run
    """

    status: str = Field(..., description="Status of the test run")
    task_ids: List[str] = Field(..., description="List of Celery task IDs")
    message: str = Field(..., description="Message about the test run")
    case_ids: List[int] = Field(..., description="List of test case IDs")
    flow_id: str = Field(..., description="Flow ID")
    input_text: Optional[str] = Field(None, description="Input text for the test")
    input_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Input metadata for the test"
    )


class FlowTestRunResponse(BaseModel):
    """
    Response model for flow test run
    """

    status: str = Field(..., description="Status of the test run")
    task_id: str = Field(..., description="Celery task ID")
    message: str = Field(..., description="Message about the test run")
    case_id: int = Field(..., description="Test case ID")
    flow_id: str = Field(..., description="Flow ID")


class FlowTestCancelRequest(BaseModel):
    """
    Request model for cancelling a flow test
    """

    task_id: str = Field(..., description="Celery task ID to cancel")


class FlowTestCancelResponse(BaseModel):
    """
    Response model for flow test cancellation
    """

    status: str = Field(..., description="Status of the test run after cancellation")
    task_id: str = Field(..., description="Celery task ID that was cancelled")
    message: str = Field(..., description="Message about the cancellation")
    cancelled: bool = Field(
        ..., description="Whether the test was successfully cancelled"
    )


class FlowBatchTestCancelRequest(BaseModel):
    """
    Request model for cancelling multiple flow tests
    """

    task_ids: List[str] = Field(..., description="List of Celery task IDs to cancel")


class FlowBatchTestCancelResponse(BaseModel):
    """
    Response model for batch flow test cancellation
    """

    cancelled_task_ids: List[str] = Field(
        ..., description="List of task IDs that were successfully cancelled"
    )
    failed_task_ids: List[str] = Field(
        ..., description="List of task IDs that failed to cancel"
    )
    message: str = Field(..., description="Message about the batch cancellation")
    total_cancelled: int = Field(..., description="Total number of tests cancelled")
    total_failed: int = Field(
        ..., description="Total number of tests that failed to cancel"
    )
