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
    TestCaseCreateRequest,
    TestCaseResponse,
    TestCaseUpdateRequest,
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
                    pass_criteria=case.pass_criteria,
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


@flow_test_router.post("/cases", response_model=TestCaseResponse)
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
        test_case = flow_test_service.create_test_case(
            suite_id=request.suite_id,
            name=request.name,
            description=request.description,
            input_data=request.input_data,
            pass_criteria=request.pass_criteria,
            test_metadata=request.test_metadata,
            run_detail=request.run_detail,
            timeout_ms=request.timeout_ms,
        )

        response = TestCaseResponse(
            id=test_case.id,
            case_id=test_case.id,
            suite_id=test_case.suite_id,
            name=test_case.name,
            description=test_case.description,
            is_active=test_case.is_active,
            input_data=test_case.input_data,
            pass_criteria=test_case.pass_criteria,
            test_metadata=test_case.test_metadata,
            run_detail=test_case.run_detail,
            timeout_ms=test_case.timeout_ms,
            status=test_case.status.value if test_case.status else None,
            actual_output=test_case.actual_output,
            error_message=test_case.error_message,
            execution_time_ms=test_case.execution_time_ms,
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


@flow_test_router.put("/cases/{case_id}", response_model=TestCaseResponse)
async def update_test_case(
    case_id: int = Path(..., description="Test case ID"),
    request: TestCaseUpdateRequest = None,
    flow_test_service: FlowTestService = Depends(get_flow_test_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Update a test case by its ID
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

        # Update the test case
        updated_test_case = flow_test_service.update_test_case(
            case_id=case_id,
            name=request.name,
            description=request.description,
            is_active=request.is_active,
            input_data=request.input_data,
            pass_criteria=request.pass_criteria,
            test_metadata=request.test_metadata,
            run_detail=request.run_detail,
            timeout_ms=request.timeout_ms,
            status=request.status,
            actual_output=request.actual_output,
            error_message=request.error_message,
            execution_time_ms=request.execution_time_ms,
        )

        response = TestCaseResponse(
            id=updated_test_case.id,
            case_id=updated_test_case.id,
            suite_id=updated_test_case.suite_id,
            name=updated_test_case.name,
            description=updated_test_case.description,
            is_active=updated_test_case.is_active,
            input_data=updated_test_case.input_data,
            pass_criteria=updated_test_case.pass_criteria,
            test_metadata=updated_test_case.test_metadata,
            run_detail=updated_test_case.run_detail,
            timeout_ms=updated_test_case.timeout_ms,
            status=updated_test_case.status.value if updated_test_case.status else None,
            actual_output=updated_test_case.actual_output,
            error_message=updated_test_case.error_message,
            execution_time_ms=updated_test_case.execution_time_ms,
        )

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error updating test case with ID {case_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while updating the test case.",
        )
