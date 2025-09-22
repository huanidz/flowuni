import traceback
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_db
from src.dependencies.flow_dep import get_flow_service
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
from src.models.alchemy.flows.FlowModel import FlowModel
from src.repositories.FlowTestRepository import FlowTestRepository
from src.schemas.flows.flow_test_schemas import (
    TestCaseResponse,
    TestSuiteCreateRequest,
    TestSuiteCreateResponse,
    TestSuiteWithCasesResponse,
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


@flow_test_router.get("/suites", response_model=List[TestSuiteWithCasesResponse])
async def get_test_suites_with_cases(
    flow_id: str,
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get all test suites with their test cases for a specific flow
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

        # Get the test suites with cases
        test_suites = flow_test_service.get_test_suites_with_cases_by_flow_id(
            flow_id=flow_id
        )

        # Convert to response format
        response = []
        for suite in test_suites:
            test_cases = []
            for case in suite.test_cases:
                test_case = TestCaseResponse(
                    id=case.id,
                    case_id=case.id,
                    suite_id=case.id,
                    name=case.name,
                    description=case.description,
                    is_active=case.is_active,
                    input_data=case.input_data,
                    expected_output=case.expected_output,
                    test_metadata=case.test_metadata,
                    run_detail=case.run_detail,
                    timeout_ms=case.timeout_ms,
                    status=case.status.value if case.status else None,
                    actual_output=case.actual_output,
                    error_message=case.error_message,
                    execution_time_ms=case.execution_time_ms,
                )
                test_cases.append(test_case)

            suite_response = TestSuiteWithCasesResponse(
                id=suite.id,
                suite_id=suite.id,
                flow_id=suite.flow_id,
                name=suite.name,
                description=suite.description,
                is_active=suite.is_active,
                suite_metadata=suite.suite_metadata,
                test_cases=test_cases,
            )
            response.append(suite_response)

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error retrieving test suites with cases for flow {flow_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving test suites with cases.",
        )
