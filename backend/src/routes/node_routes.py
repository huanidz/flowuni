from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.nodes.NodeBase import NodeSpec
from src.services.NodeService import NodeService

node_router = APIRouter(
    prefix="/api/node",
    tags=["node"],
)


@node_router.get("/catalog", response_model=List[NodeSpec])
def get_catalog(request: Request, user_id: int = Depends(get_current_user)):
    try:
        # Create an instance of the service
        node_service = NodeService()

        # Call the service method with the request object
        return node_service.get_catalog(request)
    except Exception as e:
        logger.error(
            f"Error generating node catalog for user {user_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating node catalog",
        )
