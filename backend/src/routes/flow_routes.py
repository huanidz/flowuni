import math
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.flow_dep import get_flow_service
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
from src.schemas.flowbuilder.flow_crud_schemas import (
    EmptyFlowCreateResponse,
    FlowCreateRequest,
    FlowCreateResponse,
)
from src.schemas.flows.flow_schemas import (
    FlowPatchRequest,
    FlowPatchResponse,
    GetFlowDetailResponse,
    GetFlowResponse,
    Pagination,
)
from src.services.FlowService import FlowService

flow_router = APIRouter(
    prefix="/api/flows",
    tags=["flow_crud"],
)


@flow_router.post("/", response_model=EmptyFlowCreateResponse)
async def create_empty_flow(
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Receives, validates, and queues a flow graph compilation task.
    """
    try:
        flow_id = flow_service.create_empty_flow(user_id=auth_user_id)
        response = EmptyFlowCreateResponse(flow_id=flow_id)

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error queuing compilation task: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the compilation task.",
        )


@flow_router.post("/with-data", response_model=FlowCreateResponse)
async def create_flow_with_data(
    request: FlowCreateRequest,
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Create a flow with optional name and flow definition
    """
    try:
        flow = flow_service.create_flow_with_data(
            user_id=auth_user_id, flow_request=request
        )

        response = FlowCreateResponse(
            flow_id=flow.flow_id,
            name=flow.name,
            description=flow.description,
            is_active=flow.is_active,
            flow_definition=flow.flow_definition,
        )

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error creating flow with data: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the flow with data.",
        )


@flow_router.get("/", response_model=GetFlowResponse)
async def get_by_user_id(
    user_id: int = Query(..., description="User ID"),
    page: int = Query(1, description="Page number", ge=1),
    per_page: int = Query(10, description="Number of items per page", ge=1, le=100),
    auth_user_id: int = Depends(get_current_user),
    flow_service: FlowService = Depends(get_flow_service),
):
    """
    Get flows by user id
    """
    try:
        if auth_user_id != user_id:
            logger.warning(
                f"User ID mismatch: requested user ID {user_id} \
                does not match authenticated user ID {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        flows, total_items = flow_service.get_by_user_id_paged(
            user_id=user_id, page=page, per_page=per_page
        )

        # Interpolate total pages
        total_pages = math.ceil(total_items / per_page) if per_page else 0

        response = GetFlowResponse(
            data=flows,
            pagination=Pagination(
                page=page,
                page_size=per_page,
                total_pages=total_pages,
                total_items=total_items,
            ),
        )

        return response
    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error retrieving flows by user ID {user_id}: {e}. Traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving flows by user ID.",
        )


@flow_router.get("/{flow_id}", response_model=GetFlowDetailResponse)
async def get_flow_detail_by_id(
    flow_id: str,
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Get flow by id
    """
    try:
        flow = flow_service.get_flow_detail_by_id(flow_id=flow_id)

        if not flow:
            logger.warning(f"Flow with ID {flow_id} not found.")
            raise NOT_FOUND_EXCEPTION

        if auth_user_id != flow.user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, \
                but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        response = GetFlowDetailResponse(
            flow_id=flow.flow_id,
            name=flow.name,
            description=flow.description,
            is_active=flow.is_active,
            flow_definition=flow.flow_definition,
        )
        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error retrieving flow by ID {flow_id}: {e}. Traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving flow by ID.",
        )


@flow_router.patch("/{flow_id}", response_model=FlowPatchResponse)
async def update_flow_by_id(
    request: FlowPatchRequest,
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Update flow by id
    """
    try:
        logger.info(f"Update flow by id: {request}")
        flow = flow_service.save_flow_detail(flow_request=request, user_id=auth_user_id)

        if not flow:
            logger.warning(f"Flow with ID {request.flow_id} not found.")
            raise NOT_FOUND_EXCEPTION

        response = FlowPatchResponse(
            flow_id=flow.flow_id,
            name=flow.name,
            description=flow.description,
            is_active=flow.is_active,
            flow_definition=flow.flow_definition,
        )

        return response

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error updating flow by ID {request.flow_id}: {e}. Traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while updating flow by ID.",
        )


@flow_router.delete("/{flow_id}", status_code=204)
async def delete_flow_by_id(
    flow_id: str,
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Delete flow by id
    """
    try:
        flow = flow_service.get_flow_detail_by_id(flow_id=flow_id)

        if not flow:
            logger.warning(f"Flow with ID {flow_id} not found.")
            raise NOT_FOUND_EXCEPTION

        if auth_user_id != flow.user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, \
                but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        flow_service.delete_flow(flow_id=flow_id)

        # No response body for 204 No Content
        return

    except HTTPException as http_exc:
        raise http_exc  # Re-raise known HTTP exceptions

    except Exception as e:
        logger.error(
            f"Error deleting flow by ID {flow_id}: {e}. Traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting flow by ID.",
        )
