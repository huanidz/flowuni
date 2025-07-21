import traceback

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger
from sqlalchemy.orm import Session
from src.dependencies.db_dependency import get_db
from src.models.alchemy.flows.FlowModel import FlowModel
from src.repositories.FlowRepositories import FlowRepository
from src.schemas.flowbuilder.flow_crud_schemas import EmptyFlowCreateResponse

flow_router = APIRouter(
    prefix="/api/flow",
    tags=["flow_crud"],
)


# Dependencies
def get_flow_repository(db_session: Session = Depends(get_db)) -> FlowRepository:
    return FlowRepository(db_session=db_session)


@flow_router.post("/create", response_model=EmptyFlowCreateResponse)
async def create_empty_flow(
    request: Request, flow_repository: FlowRepository = Depends(get_flow_repository)
):
    """
    Receives, validates, and queues a flow graph compilation task.
    """
    try:
        request_json = await request.json()

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
