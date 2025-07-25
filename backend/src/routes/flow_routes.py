import math
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.flow_dep import get_flow_service
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.schemas.flowbuilder.flow_crud_schemas import EmptyFlowCreateResponse
from src.schemas.flows.flow_schemas import GetFlowResponse, Pagination
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

    except Exception as e:
        logger.error(
            f"Error queuing compilation task: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while queuing the compilation task.",
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
    except Exception as e:
        logger.error(
            f"Error retrieving flows by user ID {user_id}: {e}. Traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving flows by user ID.",
        )
