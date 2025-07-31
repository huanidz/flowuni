from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.node_dep import get_node_registry, get_node_service
from src.nodes.handles.HandleBase import HandleTypeBase
from src.nodes.NodeBase import Node, NodeSpec
from src.nodes.NodeRegistry import NodeRegistry
from src.schemas.nodes.node_schemas import ResolveRequest
from src.services.NodeService import NodeService

node_router = APIRouter(
    prefix="/api/node",
    tags=["node"],
)


@node_router.get("/catalog", response_model=List[NodeSpec])
def get_catalog(
    request: Request,
    user_id: int = Depends(get_current_user),
    node_service: NodeService = Depends(get_node_service),
):
    try:
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


@node_router.post("/resolve")
def resolve_dynamic_input(
    req: ResolveRequest, node_registry: NodeRegistry = Depends(get_node_registry)
):
    node_cls: Node = node_registry.get_node_class_by_name(req.node_type)
    node_instance = node_cls()

    input_handle = node_cls.get_input_handle(req.input_name)
    if not isinstance(input_handle, HandleTypeBase) or not input_handle.dynamic:
        raise HTTPException(400, "Input is not dynamically resolvable")

    return input_handle.resolve(node_instance, req.inputs, req.parameters)
