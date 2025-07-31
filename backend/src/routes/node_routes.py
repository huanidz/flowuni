from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.node_dep import get_node_registry, get_node_service
from src.nodes.handles.HandleBase import HandleTypeBase
from src.nodes.NodeBase import NodeSpec
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
    req: ResolveRequest,
    node_registry: NodeRegistry = Depends(get_node_registry),
):
    """
    Resolves a dynamic input handle for a given node type and input name.

    Args:
        req: The request containing node_name, input_name, inputs, and parameters
        node_registry: Dependency to retrieve node classes by name

    Returns:
        List of resolved values from the dynamic handle resolver function.

    Raises:
        HTTPException(400): If node not found, input handle missing, or not dynamically resolvable.
        HTTPException(500): On unexpected internal errors.
    """
    try:
        # Validate required fields
        if not req.node_name:
            raise HTTPException(
                status_code=400, detail="Missing 'node_name' in request"
            )

        if not req.input_name:
            raise HTTPException(
                status_code=400, detail="Missing 'input_name' in request"
            )

        # Get node class by name
        node_cls = node_registry.get_node_class_by_name(req.node_name)
        if not node_cls:
            logger.warning(f"Node type '{req.node_name}' not found in registry")
            raise HTTPException(
                status_code=404, detail=f"Node type '{req.node_name}' not registered"
            )

        # Instantiate the node
        node_instance = node_cls()

        # Get input handle by name
        input_handle = node_cls.get_input_handle(req.input_name)
        if not isinstance(input_handle, HandleTypeBase):
            logger.warning(
                f"Input handle '{req.input_name}' is not a valid HandleTypeBase"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Input '{req.input_name}' does not exist or is invalid",
            )

        # Check if the input is dynamically resolvable
        if not input_handle.dynamic:
            logger.warning(f"Input handle '{req.input_name}' is not dynamic")
            raise HTTPException(
                status_code=400,
                detail=f"Input '{req.input_name}' is not dynamically resolvable",
            )

        # Resolve using the resolver method on node instance
        resolved_values = input_handle.resolve(
            node_instance, req.input_values, req.parameters
        )

        return resolved_values

    except HTTPException:
        raise  # Re-raise known exceptions without extra logging
    except Exception as e:
        logger.error(
            f"Unexpected error resolving dynamic input for node '{req.node_name}', "
            f"input '{req.input_name}': {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while resolving dynamic input",
        )
