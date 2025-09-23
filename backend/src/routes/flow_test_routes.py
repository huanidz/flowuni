import traceback

from fastapi import APIRouter, Depends, HTTPException, Path
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_db
from src.dependencies.flow_dep import get_flow_service
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
from src.repositories.FlowTestRepository import FlowTestRepository
from src.schemas.flows.flow_test_schemas import (
    TestCaseCreateRequest,
    TestCaseCreateResponse,
    TestCaseGetResponse,
    TestSuiteCreateRequest,
    TestSuiteCreateResponse,
    TestSuitesWithCasePreviewsResponse,
)
from src.services.FlowService import FlowService
from src.services.FlowTestService import FlowTestService

flow_test_router = APIRouter(
    prefix="/api/flow-tests",
    tags=["flow_tests"],
)


# Dependencies
def get_flow_test_repository(db_session=Depends(get_db)) -> FlowTestRepository:
    return FlowTestRepository(db_session=db_session)


def get_flow_test_service(
    test_repository: FlowTestRepository = Depends(get_flow_test_repository),
) -> FlowTestService:
    """
    Dependency that returns FlowTestService instance.
    """
    return FlowTestService(test_repository=test_repository)


@flow_test_router.post("/suites", response_model=TestSuiteCreateResponse)
async def create_test_suite(
    request: TestSuiteCreateRequest,
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Create a new test suite for a flow
    """
    try:
        # Verify the flow exists and the user has access to it
        flow = flow_service.get_flow_detail_by_id(flow_id=request.flow_id)
        if not flow:
            logger.warning(f"Flow with ID {request.flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Check if the user is the owner of the flow
        if flow.user_id != auth_user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Create the test suite
        test_suite = flow_test_service.create_test_suite(
            flow_id=request.flow_id,
            name=request.name,
            description=request.description,
        )

        response = TestSuiteCreateResponse(
            id=test_suite.id,
            flow_id=test_suite.flow_id,
            name=test_suite.name,
            description=test_suite.description,
            is_active=test_suite.is_active,
        )

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error creating test suite: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the test suite.",
        )


@flow_test_router.delete("/suites/{suite_id}", status_code=204)
async def delete_test_suite(
    suite_id: int = Path(..., description="Test suite ID"),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Delete a test suite by its ID
    """
    try:
        # First get the test suite to verify it exists
        test_suite = flow_test_service.get_test_suite_by_id(suite_id=suite_id)
        if not test_suite:
            logger.warning(f"Test suite with ID {suite_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Get the flow to verify user ownership
        flow = flow_service.get_flow_detail_by_id(flow_id=test_suite.flow_id)
        if not flow:
            logger.warning(f"Flow with ID {test_suite.flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Check if the user is the owner of the flow
        if flow.user_id != auth_user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Delete the test suite
        flow_test_service.delete_test_suite(suite_id=suite_id)

        # No response body for 204 No Content
        return

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error deleting test suite with ID {suite_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the test suite.",
        )


@flow_test_router.delete("/cases/{case_id}", status_code=204)
async def delete_test_case(
    case_id: int = Path(..., description="Test case ID"),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Delete a test case by its ID
    """
    try:
        # First get the test case to verify it exists
        test_case = flow_test_service.get_test_case_by_id(case_id=case_id)
        if not test_case:
            logger.warning(f"Test case with ID {case_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Get the test suite to verify user ownership
        test_suite = flow_test_service.get_test_suite_by_id(suite_id=test_case.suite_id)
        if not test_suite:
            logger.warning(f"Test suite with ID {test_case.suite_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Get the flow to verify user ownership
        flow = flow_service.get_flow_detail_by_id(flow_id=test_suite.flow_id)
        if not flow:
            logger.warning(f"Flow with ID {test_suite.flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Check if the user is the owner of the flow
        if flow.user_id != auth_user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Delete the test case
        flow_test_service.delete_test_case(case_id=case_id)

        # No response body for 204 No Content
        return

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error deleting test case with ID {case_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the test case.",
        )


# === Test Case Endpoints ===


@flow_test_router.post("/cases", response_model=TestCaseCreateResponse)
async def create_test_case(
    request: TestCaseCreateRequest,
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Create a new test case for a test suite
    """
    try:
        # First get the test suite to verify it exists
        test_suite = flow_test_service.get_test_suite_by_id(suite_id=request.suite_id)
        if not test_suite:
            logger.warning(f"Test suite with ID {request.suite_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Get the flow to verify user ownership
        flow = flow_service.get_flow_detail_by_id(flow_id=test_suite.flow_id)
        if not flow:
            logger.warning(f"Flow with ID {test_suite.flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Check if the user is the owner of the flow
        if flow.user_id != auth_user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Create the test case
        test_case = flow_test_service.create_empty_test_case(
            suite_id=request.suite_id,
            name=request.name,
            desc=request.desc,
            flow_definition=request.flow_definition,
        )

        response = TestCaseCreateResponse(
            id=test_case.id,
            suite_id=test_case.suite_id,
            name=test_case.name,
            description=test_case.description,
            is_active=test_case.is_active,
            flow_definition=test_case.flow_definition,
        )

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error creating test case: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the test case.",
        )


@flow_test_router.get("/cases/{case_id}", response_model=TestCaseGetResponse)
async def get_test_case(
    case_id: int = Path(..., description="Test case ID"),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get a test case by its ID
    """
    try:
        # First get the test case to verify it exists
        test_case = flow_test_service.get_test_case_by_id(case_id=case_id)
        if not test_case:
            logger.warning(f"Test case with ID {case_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Get the test suite to verify user ownership
        test_suite = flow_test_service.get_test_suite_by_id(suite_id=test_case.suite_id)
        if not test_suite:
            logger.warning(f"Test suite with ID {test_case.suite_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Get the flow to verify user ownership
        flow = flow_service.get_flow_detail_by_id(flow_id=test_suite.flow_id)
        if not flow:
            logger.warning(f"Flow with ID {test_suite.flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Check if the user is the owner of the flow
        if flow.user_id != auth_user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        response = TestCaseGetResponse(
            id=test_case.id,
            suite_id=test_case.suite_id,
            name=test_case.name,
            description=test_case.description,
            is_active=test_case.is_active,
            flow_definition=test_case.flow_definition,
            input_data=test_case.input_data,
            input_metadata=test_case.input_metadata,
            pass_criteria=test_case.pass_criteria,
            timeout_ms=test_case.timeout_ms,
        )

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error getting test case with ID {case_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while getting the test case.",
        )


@flow_test_router.get(
    "/suites-with-previews/{flow_id}",
    response_model=TestSuitesWithCasePreviewsResponse,
)
async def list_test_suites_with_case_previews(
    flow_id: str = Path(..., description="Flow ID"),
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get all test suites for a flow with test case previews
    """
    try:
        # Verify the flow exists and the user has access to it
        flow = flow_service.get_flow_detail_by_id(flow_id=flow_id)
        if not flow:
            logger.warning(f"Flow with ID {flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Check if the user is the owner of the flow
        if flow.user_id != auth_user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Get test suites with case previews
        test_suites = flow_test_service.get_test_suites_with_case_previews(
            flow_id=flow_id
        )

        # The data is already in the correct format from the service
        return TestSuitesWithCasePreviewsResponse(test_suites=test_suites)

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error getting test suites with case previews for flow {flow_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while getting the test suites with case previews.",
        )
