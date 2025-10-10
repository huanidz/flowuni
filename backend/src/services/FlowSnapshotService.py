import asyncio
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.configs.config import get_app_settings
from src.exceptions.shared_exceptions import MISMATCH_EXCEPTION, NOT_FOUND_EXCEPTION
from src.models.alchemy.flows.FlowSnapshotModel import FlowSnapshotModel
from src.repositories.FlowSnapshotRepository import FlowSnapshotRepository
from src.schemas.flows.flow_snapshot_schemas import (
    FlowSnapshotCreateRequest,
    FlowSnapshotResponse,
    FlowSnapshotUpdateRequest,
)


class FlowSnapshotServiceInterface(ABC):
    """
    Flow snapshot service interface
    """

    @abstractmethod
    async def get_snapshot_by_id(
        self, session: AsyncSession, snapshot_id: int
    ) -> Optional[FlowSnapshotResponse]:
        """
        Get flow snapshot by id
        """
        pass

    @abstractmethod
    async def get_snapshots_by_flow_id(
        self, session: AsyncSession, flow_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple[List[FlowSnapshotModel], int]:
        """
        Get flow snapshots by flow id with pagination
        """
        pass

    @abstractmethod
    async def create_snapshot(
        self,
        session: AsyncSession,
        snapshot_request: FlowSnapshotCreateRequest,
        user_id: int,
    ) -> FlowSnapshotResponse:
        """
        Create a new flow snapshot
        """
        pass

    @abstractmethod
    async def update_snapshot(
        self,
        session: AsyncSession,
        snapshot_request: FlowSnapshotUpdateRequest,
        user_id: int,
    ) -> Optional[FlowSnapshotResponse]:
        """
        Update an existing flow snapshot
        """
        pass

    @abstractmethod
    async def delete_snapshot(
        self, session: AsyncSession, snapshot_id: int, user_id: int
    ) -> None:
        """
        Delete a flow snapshot
        """
        pass


class FlowSnapshotService(FlowSnapshotServiceInterface):
    """
    Flow snapshot service
    """

    def __init__(self, snapshot_repository: FlowSnapshotRepository | None = None):
        self.snapshot_repository = snapshot_repository or FlowSnapshotRepository()

    async def get_snapshot_by_id(
        self, session: AsyncSession, snapshot_id: int
    ) -> Optional[FlowSnapshotResponse]:
        """
        Get flow snapshot by id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                snapshot = await self.snapshot_repository.get_by_id(
                    session=session, snapshot_id=snapshot_id
                )
                if not snapshot:
                    logger.warning(f"Snapshot with id {snapshot_id} not found")
                    return None

                logger.info(f"Successfully retrieved snapshot with id {snapshot_id}")
                return self._map_to_response(snapshot)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error retrieving snapshot by id {snapshot_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    async def get_snapshots_by_flow_id(
        self, session: AsyncSession, flow_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple[List[FlowSnapshotModel], int]:
        """
        Get flow snapshots by flow id with pagination
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                (
                    snapshots,
                    total_items,
                ) = await self.snapshot_repository.get_by_flow_id_paged(
                    session=session, flow_id=flow_id, page=page, per_page=per_page
                )
                logger.info(
                    f"Successfully retrieved {len(snapshots)} snapshots for flow {flow_id}"
                )
                return snapshots, total_items
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error retrieving snapshots for flow {flow_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    async def create_snapshot(
        self,
        session: AsyncSession,
        snapshot_request: FlowSnapshotCreateRequest,
        user_id: int,
    ) -> FlowSnapshotResponse:
        """
        Create a new flow snapshot
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Get the next version number if not provided in the request
                    if snapshot_request.version is not None:
                        version = snapshot_request.version
                    else:
                        version = await self.snapshot_repository.get_next_version(
                            session=session, flow_id=snapshot_request.flow_id
                        )

                    # Create the snapshot model
                    snapshot = FlowSnapshotModel(
                        flow_id=snapshot_request.flow_id,
                        version=version,
                        name=snapshot_request.name,
                        description=snapshot_request.description,
                        flow_definition=snapshot_request.flow_definition,
                        snapshot_metadata=snapshot_request.snapshot_metadata,
                        flow_schema_version=snapshot_request.flow_schema_version,
                    )

                    # Save the snapshot
                    created_snapshot = await self.snapshot_repository.create_snapshot(
                        session=session, snapshot=snapshot
                    )

                    logger.info(
                        f"Successfully created snapshot for flow {snapshot_request.flow_id}"
                    )
                    return self._map_to_response(created_snapshot)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error creating snapshot for flow {snapshot_request.flow_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail=f"Failed to create snapshot: {str(e)}"
            )

    async def update_snapshot(
        self,
        session: AsyncSession,
        snapshot_request: FlowSnapshotUpdateRequest,
        user_id: int,
    ) -> Optional[FlowSnapshotResponse]:
        """
        Update an existing flow snapshot
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Get the existing snapshot
                    existing_snapshot = await self.snapshot_repository.get_by_id(
                        session=session, snapshot_id=snapshot_request.id
                    )
                    if not existing_snapshot:
                        logger.warning(
                            f"Snapshot with id {snapshot_request.id} not found"
                        )
                        raise NOT_FOUND_EXCEPTION

                    # Check if the user owns the flow this snapshot belongs to
                    if existing_snapshot.flow.user_id != user_id:
                        logger.warning(
                            f"User {user_id} attempted to modify snapshot {snapshot_request.id} "
                            f"owned by different user"
                        )
                        raise MISMATCH_EXCEPTION

                    # Create a new snapshot model with the updated values
                    updated_snapshot = FlowSnapshotModel(
                        id=snapshot_request.id,
                        flow_id=existing_snapshot.flow_id,
                        version=existing_snapshot.version,
                        name=snapshot_request.name
                        if snapshot_request.name is not None
                        else existing_snapshot.name,
                        description=snapshot_request.description
                        if snapshot_request.description is not None
                        else existing_snapshot.description,
                        flow_definition=snapshot_request.flow_definition
                        if snapshot_request.flow_definition is not None
                        else existing_snapshot.flow_definition,
                        snapshot_metadata=snapshot_request.snapshot_metadata
                        if snapshot_request.snapshot_metadata is not None
                        else existing_snapshot.snapshot_metadata,
                        flow_schema_version=snapshot_request.flow_schema_version
                        if snapshot_request.flow_schema_version is not None
                        else existing_snapshot.flow_schema_version,
                    )

                    # Update the snapshot
                    result = await self.snapshot_repository.update_snapshot(
                        session=session, snapshot=updated_snapshot
                    )
                    logger.info(f"Successfully updated snapshot {snapshot_request.id}")
                    return self._map_to_response(result)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except (NOT_FOUND_EXCEPTION, MISMATCH_EXCEPTION) as e:
            raise HTTPException(
                status_code=404 if e == NOT_FOUND_EXCEPTION else 403, detail=str(e)
            )
        except Exception as e:
            logger.error(f"Error updating snapshot {snapshot_request.id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to update snapshot: {str(e)}"
            )

    async def delete_snapshot(
        self, session: AsyncSession, snapshot_id: int, user_id: int
    ) -> None:
        """
        Delete a flow snapshot
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Get the existing snapshot
                    existing_snapshot = await self.snapshot_repository.get_by_id(
                        session=session, snapshot_id=snapshot_id
                    )
                    if not existing_snapshot:
                        logger.warning(f"Snapshot with id {snapshot_id} not found")
                        raise NOT_FOUND_EXCEPTION

                    # Check if the user owns the flow this snapshot belongs to
                    if existing_snapshot.flow.user_id != user_id:
                        logger.warning(
                            f"User {user_id} attempted to delete snapshot {snapshot_id} "
                            f"owned by different user"
                        )
                        raise MISMATCH_EXCEPTION

                    # Delete the snapshot
                    await self.snapshot_repository.delete_snapshot(
                        session=session, snapshot_id=snapshot_id
                    )
                    logger.info(f"Successfully deleted snapshot {snapshot_id}")
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except (NOT_FOUND_EXCEPTION, MISMATCH_EXCEPTION) as e:
            raise HTTPException(
                status_code=404 if e == NOT_FOUND_EXCEPTION else 403, detail=str(e)
            )
        except Exception as e:
            logger.error(f"Error deleting snapshot {snapshot_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to delete snapshot: {str(e)}"
            )

    def _map_to_response(self, snapshot: FlowSnapshotModel) -> FlowSnapshotResponse:
        """
        Map a FlowSnapshotModel to a FlowSnapshotResponse
        """
        return FlowSnapshotResponse(
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
