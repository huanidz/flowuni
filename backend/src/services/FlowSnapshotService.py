from abc import ABC, abstractmethod
from typing import List, Optional, Tuple

from loguru import logger
from src.exceptions.shared_exceptions import MISMATCH_EXCEPTION, NOT_FOUND_EXCEPTION
from src.models.alchemy.flows.FlowSnapshotModel import FlowSnapshotModel
from src.repositories.FlowSnapshotRepository import FlowSnapshotRepository
from src.schemas.flows.flow_snapshot_schemas import (
    FlowSnapshotCreateRequest,
    FlowSnapshotResponse,
    FlowSnapshotSetCurrentRequest,
    FlowSnapshotSetCurrentResponse,
    FlowSnapshotUpdateRequest,
)


class FlowSnapshotServiceInterface(ABC):
    """
    Flow snapshot service interface
    """

    @abstractmethod
    def get_snapshot_by_id(self, snapshot_id: int) -> Optional[FlowSnapshotResponse]:
        """
        Get flow snapshot by id
        """
        pass

    @abstractmethod
    def get_snapshots_by_flow_id(
        self, flow_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple[List[FlowSnapshotModel], int]:
        """
        Get flow snapshots by flow id with pagination
        """
        pass

    @abstractmethod
    def get_current_snapshot(self, flow_id: int) -> Optional[FlowSnapshotResponse]:
        """
        Get the current snapshot for a flow
        """
        pass

    @abstractmethod
    def create_snapshot(
        self, snapshot_request: FlowSnapshotCreateRequest, user_id: int
    ) -> FlowSnapshotResponse:
        """
        Create a new flow snapshot
        """
        pass

    @abstractmethod
    def update_snapshot(
        self, snapshot_request: FlowSnapshotUpdateRequest, user_id: int
    ) -> Optional[FlowSnapshotResponse]:
        """
        Update an existing flow snapshot
        """
        pass

    @abstractmethod
    def delete_snapshot(self, snapshot_id: int, user_id: int) -> None:
        """
        Delete a flow snapshot
        """
        pass

    @abstractmethod
    def set_current_snapshot(
        self, request: FlowSnapshotSetCurrentRequest, user_id: int
    ) -> FlowSnapshotSetCurrentResponse:
        """
        Set a snapshot as the current version
        """
        pass


class FlowSnapshotService(FlowSnapshotServiceInterface):
    """
    Flow snapshot service
    """

    def __init__(self, snapshot_repository: FlowSnapshotRepository):
        self.snapshot_repository = snapshot_repository

    def get_snapshot_by_id(self, snapshot_id: int) -> Optional[FlowSnapshotResponse]:
        """
        Get flow snapshot by id
        """
        try:
            snapshot = self.snapshot_repository.get_by_id(snapshot_id=snapshot_id)
            if not snapshot:
                logger.warning(f"Snapshot with id {snapshot_id} not found")
                return None

            logger.info(f"Successfully retrieved snapshot with id {snapshot_id}")
            return self._map_to_response(snapshot)
        except Exception as e:
            logger.error(f"Error retrieving snapshot by id {snapshot_id}: {str(e)}")
            raise

    def get_snapshots_by_flow_id(
        self, flow_id: int, page: int = 1, per_page: int = 10
    ) -> Tuple[List[FlowSnapshotModel], int]:
        """
        Get flow snapshots by flow id with pagination
        """
        try:
            snapshots, total_items = self.snapshot_repository.get_by_flow_id_paged(
                flow_id=flow_id, page=page, per_page=per_page
            )
            logger.info(
                f"Successfully retrieved {len(snapshots)} snapshots for flow {flow_id}"
            )
            return snapshots, total_items
        except Exception as e:
            logger.error(f"Error retrieving snapshots for flow {flow_id}: {str(e)}")
            raise

    def get_current_snapshot(self, flow_id: int) -> Optional[FlowSnapshotResponse]:
        """
        Get the current snapshot for a flow
        """
        try:
            snapshot = self.snapshot_repository.get_current_snapshot(flow_id=flow_id)
            if not snapshot:
                logger.info(f"No current snapshot found for flow {flow_id}")
                return None

            logger.info(f"Successfully retrieved current snapshot for flow {flow_id}")
            return self._map_to_response(snapshot)
        except Exception as e:
            logger.error(
                f"Error retrieving current snapshot for flow {flow_id}: {str(e)}"
            )
            raise

    def create_snapshot(
        self, snapshot_request: FlowSnapshotCreateRequest, user_id: int
    ) -> FlowSnapshotResponse:
        """
        Create a new flow snapshot
        """
        try:
            # Get the next version number
            next_version = self.snapshot_repository.get_next_version(
                flow_id=snapshot_request.flow_id
            )

            # Create the snapshot model
            snapshot = FlowSnapshotModel(
                flow_id=snapshot_request.flow_id,
                version=next_version,
                name=snapshot_request.name,
                description=snapshot_request.description,
                flow_definition=snapshot_request.flow_definition,
                is_current=snapshot_request.is_current,
                snapshot_metadata=snapshot_request.snapshot_metadata,
                flow_schema_version=snapshot_request.flow_schema_version,
            )

            # Save the snapshot
            created_snapshot = self.snapshot_repository.create_snapshot(
                snapshot=snapshot
            )

            # If this is marked as current, set it as current after creation
            if snapshot_request.is_current:
                self.snapshot_repository.set_current_snapshot(
                    flow_id=snapshot_request.flow_id, snapshot_id=created_snapshot.id
                )

            logger.info(
                f"Successfully created snapshot for flow {snapshot_request.flow_id}"
            )
            return self._map_to_response(created_snapshot)
        except Exception as e:
            logger.error(
                f"Error creating snapshot for flow {snapshot_request.flow_id}: {str(e)}"
            )
            raise

    def update_snapshot(
        self, snapshot_request: FlowSnapshotUpdateRequest, user_id: int
    ) -> Optional[FlowSnapshotResponse]:
        """
        Update an existing flow snapshot
        """
        try:
            # Get the existing snapshot
            existing_snapshot = self.snapshot_repository.get_by_id(
                snapshot_id=snapshot_request.id
            )
            if not existing_snapshot:
                logger.warning(f"Snapshot with id {snapshot_request.id} not found")
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
                is_current=snapshot_request.is_current
                if snapshot_request.is_current is not None
                else existing_snapshot.is_current,
                snapshot_metadata=snapshot_request.snapshot_metadata
                if snapshot_request.snapshot_metadata is not None
                else existing_snapshot.snapshot_metadata,
                flow_schema_version=snapshot_request.flow_schema_version
                if snapshot_request.flow_schema_version is not None
                else existing_snapshot.flow_schema_version,
            )

            # If this is marked as current, unset any other current snapshots
            if snapshot_request.is_current and not existing_snapshot.is_current:
                self.snapshot_repository.set_current_snapshot(
                    flow_id=existing_snapshot.flow_id, snapshot_id=snapshot_request.id
                )

            # Update the snapshot
            result = self.snapshot_repository.update_snapshot(snapshot=updated_snapshot)
            logger.info(f"Successfully updated snapshot {snapshot_request.id}")
            return self._map_to_response(result)
        except Exception as e:
            logger.error(f"Error updating snapshot {snapshot_request.id}: {str(e)}")
            raise

    def delete_snapshot(self, snapshot_id: int, user_id: int) -> None:
        """
        Delete a flow snapshot
        """
        try:
            # Get the existing snapshot
            existing_snapshot = self.snapshot_repository.get_by_id(
                snapshot_id=snapshot_id
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
            self.snapshot_repository.delete_snapshot(snapshot_id=snapshot_id)
            logger.info(f"Successfully deleted snapshot {snapshot_id}")
        except Exception as e:
            logger.error(f"Error deleting snapshot {snapshot_id}: {str(e)}")
            raise

    def set_current_snapshot(
        self, request: FlowSnapshotSetCurrentRequest, user_id: int
    ) -> FlowSnapshotSetCurrentResponse:
        """
        Set a snapshot as the current version
        """
        try:
            # Get the existing snapshot
            existing_snapshot = self.snapshot_repository.get_by_id(
                snapshot_id=request.snapshot_id
            )
            if not existing_snapshot:
                logger.warning(f"Snapshot with id {request.snapshot_id} not found")
                raise NOT_FOUND_EXCEPTION

            # Check if the user owns the flow this snapshot belongs to
            if existing_snapshot.flow.user_id != user_id:
                logger.warning(
                    f"User {user_id} attempted to set snapshot {request.snapshot_id} "
                    f"as current for a flow owned by different user"
                )
                raise MISMATCH_EXCEPTION

            # Set the snapshot as current
            self.snapshot_repository.set_current_snapshot(
                flow_id=existing_snapshot.flow_id, snapshot_id=request.snapshot_id
            )
            logger.info(
                f"Successfully set snapshot {request.snapshot_id} as current for flow {existing_snapshot.flow_id}"
            )

            return FlowSnapshotSetCurrentResponse(
                success=True,
                message=f"Snapshot {request.snapshot_id} set as current version",
                current_snapshot_id=request.snapshot_id,
            )
        except Exception as e:
            logger.error(
                f"Error setting snapshot {request.snapshot_id} as current: {str(e)}"
            )
            raise

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
            is_current=snapshot.is_current,
            snapshot_metadata=snapshot.snapshot_metadata,
            flow_schema_version=snapshot.flow_schema_version,
            created_at=snapshot.created_at.isoformat(),
            modified_at=snapshot.modified_at.isoformat(),
        )
