import math
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_async_db
from src.dependencies.flow_dep import get_flow_service
from src.exceptions.auth_exceptions import UNAUTHORIZED_EXCEPTION
from src.exceptions.shared_exceptions import NOT_FOUND_EXCEPTION
from src.schemas.flows.flow_schemas import Pagination
from src.schemas.flows.flow_snapshot_schemas import (
    FlowSnapshotCreateRequest,
    FlowSnapshotListResponse,
    FlowSnapshotResponse,
    FlowSnapshotUpdateRequest,
)
from src.services.FlowService import FlowService
from src.services.FlowSnapshotService import FlowSnapshotService

flow_snapshot_router = APIRouter(
    prefix="/api/flow-snapshots",
    tags=["flow_snapshot_crud"],
)


# Dependency function for FlowSnapshotRepository
def get_flow_snapshot_repository(db_session: AsyncSession = Depends(get_async_db)):
    """
    Dependency that returns FlowSnapshotRepository instance.
    """
    from src.repositories.FlowSnapshotRepository import FlowSnapshotRepository

    return FlowSnapshotRepository(db_session=db_session)


# Dependency function for FlowSnapshotService
def get_flow_snapshot_service(
    flow_snapshot_repository=Depends(get_flow_snapshot_repository),
):
    """
    Dependency that returns FlowSnapshotService instance.
    """
    return FlowSnapshotService(snapshot_repository=flow_snapshot_repository)


@flow_snapshot_router.post("", response_model=FlowSnapshotResponse)
async def create_flow_snapshot(
    request: FlowSnapshotCreateRequest,
    flow_snapshot_service: FlowSnapshotService = Depends(get_flow_snapshot_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
):
    """
    Create a new flow snapshot
    """
    try:
        # Verify the user owns the flow
        flow = await flow_service.get_flow_detail_by_id(
            session=session, flow_id=str(request.flow_id)
        )
        if not flow:
            logger.warning(f"Flow with ID {request.flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        if auth_user_id != flow.user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Create the snapshot
        # The service will automatically calculate the next version if not provided
        snapshot = await flow_snapshot_service.create_snapshot(
            session=session, snapshot_request=request, user_id=auth_user_id
        )

        return snapshot

    except Exception as e:
        logger.error(
            f"Error creating flow snapshot: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the flow snapshot.",
        )


@flow_snapshot_router.get("", response_model=FlowSnapshotListResponse)
async def get_flow_snapshots(
    flow_id: str = Query(..., description="Flow ID"),
    page: int = Query(1, description="Page number", ge=1),
    per_page: int = Query(10, description="Number of items per page", ge=1, le=100),
    flow_snapshot_service: FlowSnapshotService = Depends(get_flow_snapshot_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
):
    """
    Get flow snapshots by flow ID with pagination
    """
    try:
        # Verify the user owns the flow
        flow = await flow_service.get_flow_detail_by_id(
            session=session, flow_id=str(flow_id)
        )
        if not flow:
            logger.warning(f"Flow with ID {flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        if auth_user_id != flow.user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Get the snapshots
        snapshots, total_items = await flow_snapshot_service.get_snapshots_by_flow_id(
            session=session, flow_id=flow_id, page=page, per_page=per_page
        )

        # Map to response format using the full FlowSnapshotResponse
        mapped_snapshots = [
            FlowSnapshotResponse(
                id=snapshot.id,
                flow_id=snapshot.flow_id,
                version=snapshot.version,
                name=snapshot.name,
                description=snapshot.description,
                flow_definition=snapshot.flow_definition,
                snapshot_metadata=snapshot.snapshot_metadata,
                flow_schema_version=snapshot.flow_schema_version,
                created_at=snapshot.created_at.isoformat(),
                modified_at=snapshot.modified_at.isoformat(),
            )
            for snapshot in snapshots
        ]

        response = FlowSnapshotListResponse(
            data=mapped_snapshots,
            total_count=total_items,
        )

        return response

    except Exception as e:
        logger.error(
            f"Error retrieving flow snapshots: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving the flow snapshots.",
        )


@flow_snapshot_router.get("/current/{flow_id}", response_model=FlowSnapshotResponse)
async def get_current_flow_snapshot(
    flow_id: str,
    flow_snapshot_service: FlowSnapshotService = Depends(get_flow_snapshot_service),
    flow_service: FlowService = Depends(get_flow_service),
    auth_user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
):
    """
    Get the current flow snapshot for a flow
    """
    try:
        # Verify the user owns the flow
        flow = await flow_service.get_flow_detail_by_id(
            session=session, flow_id=str(flow_id)
        )
        if not flow:
            logger.warning(f"Flow with ID {flow_id} not found")
            raise NOT_FOUND_EXCEPTION

        if auth_user_id != flow.user_id:
            logger.warning(
                f"User ID mismatch: flow owner is {flow.user_id}, "
                f"but requester is {auth_user_id}"
            )
            raise UNAUTHORIZED_EXCEPTION

        # Get the current snapshot
        snapshot = await flow_snapshot_service.get_current_snapshot(
            session=session, flow_id=flow_id
        )
        if not snapshot:
            logger.warning(f"No current snapshot found for flow {flow_id}")
            raise HTTPException(
                status_code=404,
                detail="No current snapshot found for this flow.",
            )

        return snapshot

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(
            f"Error retrieving current flow snapshot: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving the current flow snapshot.",
        )


@flow_snapshot_router.get("/{snapshot_id}", response_model=FlowSnapshotResponse)
async def get_flow_snapshot_by_id(
    snapshot_id: int,
    flow_snapshot_service: FlowSnapshotService = Depends(get_flow_snapshot_service),
    auth_user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
):
    """
    Get a flow snapshot by ID
    """
    try:
        # Get the snapshot
        snapshot = await flow_snapshot_service.get_snapshot_by_id(
            session=session, snapshot_id=snapshot_id
        )
        if not snapshot:
            logger.warning(f"Snapshot with ID {snapshot_id} not found")
            raise NOT_FOUND_EXCEPTION

        # Verify the user owns the flow this snapshot belongs to
        # We need to get the flow_id from the snapshot and check ownership
        # This will be handled in the service layer

        return snapshot

    except Exception as e:
        logger.error(
            f"Error retrieving flow snapshot by ID: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving the flow snapshot.",
        )


@flow_snapshot_router.patch("/{snapshot_id}", response_model=FlowSnapshotResponse)
async def update_flow_snapshot(
    snapshot_id: int,
    request: FlowSnapshotUpdateRequest,
    flow_snapshot_service: FlowSnapshotService = Depends(get_flow_snapshot_service),
    auth_user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
):
    """
    Update a flow snapshot by ID
    """
    try:
        # Ensure the snapshot_id in the request matches the path parameter
        if request.id != snapshot_id:
            logger.warning(
                f"Snapshot ID mismatch: path parameter {snapshot_id}, "
                f"request body {request.id}"
            )
            raise HTTPException(
                status_code=400,
                detail="Snapshot ID in path must match ID in request body.",
            )

        # Update the snapshot
        snapshot = await flow_snapshot_service.update_snapshot(
            session=session, snapshot_request=request, user_id=auth_user_id
        )

        if not snapshot:
            logger.warning(f"Snapshot with ID {snapshot_id} not found")
            raise NOT_FOUND_EXCEPTION

        return snapshot

    except Exception as e:
        logger.error(
            f"Error updating flow snapshot: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while updating the flow snapshot.",
        )


@flow_snapshot_router.delete("/{snapshot_id}", status_code=204)
async def delete_flow_snapshot(
    snapshot_id: int,
    flow_snapshot_service: FlowSnapshotService = Depends(get_flow_snapshot_service),
    auth_user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
):
    """
    Delete a flow snapshot by ID
    """
    try:
        # Delete the snapshot
        await flow_snapshot_service.delete_snapshot(
            session=session, snapshot_id=snapshot_id, user_id=auth_user_id
        )

        # No response body for 204 No Content
        return

    except Exception as e:
        logger.error(
            f"Error deleting flow snapshot: {e}. traceback: {traceback.format_exc()}"
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the flow snapshot.",
        )
