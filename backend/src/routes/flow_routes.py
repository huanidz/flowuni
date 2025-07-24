import math
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.flow_dep import get_flow_repository, get_flow_service
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.models.alchemy.flows.FlowModel import FlowModel
from src.repositories.FlowRepositories import FlowRepository
from src.schemas.flowbuilder.flow_crud_schemas import EmptyFlowCreateResponse
from src.schemas.flows.flow_schemas import GetFlowResponse, Pagination
from src.services.FlowService import FlowService

flow_router = APIRouter(
    prefix="/api/flows",
    tags=["flow_crud"],
)


@flow_router.post("/", response_model=EmptyFlowCreateResponse)
async def create_empty_flow(
    request: Request,
    flow_repository: FlowRepository = Depends(get_flow_repository),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Receives, validates, and queues a flow graph compilation task.
    """
    try:
        flow: FlowModel = flow_repository.create_empty_flow()

        response = EmptyFlowCreateResponse(
            flow_id=flow.flow_id, message="new empty flow created successfully"
        )

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
    q_user_id: int = Query(..., description="User ID"),
    q_page: int = Query(1, description="Page number", ge=1),
    q_per_page: int = Query(10, description="Number of items per page", ge=1, le=100),
    auth_user_id: int = Depends(get_current_user),
    flow_service: FlowService = Depends(get_flow_service),
):
    """
    Get flows by user id
    """
    try:
        if auth_user_id != q_user_id:
            logger.warning(
                f"User ID mismatch: requested user ID {q_user_id} \
                does not match authenticated user ID {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        flows, total_items = flow_service.get_by_user_id_paged(
            user_id=q_user_id, page=q_page, per_page=q_per_page
        )

        # Interpolate total pages
        total_pages = math.ceil(total_items / q_per_page) if q_per_page else 0

        response = GetFlowResponse(
            data=flows,
            pagination=Pagination(q_page, q_per_page, total_pages, total_items),
        )

        return response
    except Exception as e:
        logger.error(f"Error retrieving flows by user ID {q_user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving flows by user ID.",
        )
