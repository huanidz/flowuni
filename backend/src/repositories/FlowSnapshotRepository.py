from typing import List, Optional, Tuple

from loguru import logger
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
from src.models.alchemy.flows.FlowSnapshotModel import FlowSnapshotModel
from src.repositories.BaseRepository import BaseRepository


class FlowSnapshotRepository(BaseRepository):
    """
    Flow Snapshot repository
    """

    def __init__(self, db_session: Session):
        super().__init__(db_session=db_session)
        self.model = FlowSnapshotModel
        logger.info("FlowSnapshotRepository initialized.")

    def get_by_id(self, snapshot_id: int) -> Optional[FlowSnapshotModel]:
        """
        Get flow snapshot by id
        """
        try:
            snapshot = (
                self.db_session.query(FlowSnapshotModel)
                .filter_by(id=snapshot_id)
                .one_or_none()
            )
            if snapshot:
                logger.info(f"Retrieved flow snapshot with ID: {snapshot_id}")
            else:
                logger.info(f"Flow snapshot with ID: {snapshot_id} not found.")
            return snapshot
        except Exception as e:
            logger.error(f"Error retrieving flow snapshot by ID {snapshot_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_by_flow_id(self, flow_id: int) -> List[FlowSnapshotModel]:
        """
        Get all flow snapshots for a specific flow
        """
        try:
            snapshots = (
                self.db_session.query(FlowSnapshotModel)
                .filter_by(flow_id=flow_id)
                .order_by(FlowSnapshotModel.version.desc())
                .all()
            )
            logger.info(f"Retrieved {len(snapshots)} snapshots for flow ID: {flow_id}")
            return snapshots
        except Exception as e:
            logger.error(f"Error retrieving snapshots for flow ID {flow_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_by_flow_id_paged(
        self,
        flow_id: int,
        page: int = 1,
        per_page: int = 10,
        sort_by_version_desc: bool = True,
    ) -> Tuple[List[FlowSnapshotModel], int]:
        """
        Get paged flow snapshots for a specific flow
        Returns a tuple of (snapshots on this page, total matching snapshots)
        """
        try:
            # 1) total count
            total_items = (
                self.db_session.query(func.count(FlowSnapshotModel.id))
                .filter_by(flow_id=flow_id)
                .scalar()
            )

            # 2) paged items
            query = self.db_session.query(FlowSnapshotModel).filter_by(flow_id=flow_id)

            # 3) sort by version descending
            if sort_by_version_desc:
                query = query.order_by(FlowSnapshotModel.version.desc())

            # Apply pagination after ordering
            query = query.offset((page - 1) * per_page).limit(per_page)

            snapshots = query.all()

            logger.info(
                f"Flow {flow_id} – page {page}: "
                f"returned {len(snapshots)} of {total_items} total snapshots."
            )
            # return both page of snapshots and metadata
            return snapshots, total_items

        except Exception as e:
            logger.error(f"Error retrieving snapshots for flow ID {flow_id}: {e}")
            self.db_session.rollback()
            raise

    def get_by_flow_and_version(
        self, flow_id: int, version: int
    ) -> Optional[FlowSnapshotModel]:
        """
        Get a specific snapshot by flow ID and version
        """
        try:
            snapshot = (
                self.db_session.query(FlowSnapshotModel)
                .filter_by(flow_id=flow_id, version=version)
                .one_or_none()
            )
            if snapshot:
                logger.info(
                    f"Retrieved snapshot for flow ID: {flow_id}, version: {version}"
                )
            else:
                logger.info(
                    f"No snapshot found for flow ID: {flow_id}, version: {version}"
                )
            return snapshot
        except Exception as e:
            logger.error(
                f"Error retrieving snapshot for flow ID {flow_id}, version {version}: {e}"
            )
            self.db_session.rollback()
            raise e

    def create_snapshot(self, snapshot: FlowSnapshotModel) -> FlowSnapshotModel:
        """
        Create a new flow snapshot
        """
        try:
            self.db_session.add(snapshot)
            self.db_session.commit()
            self.db_session.refresh(snapshot)
            logger.info(
                f"Created new snapshot for flow ID: {snapshot.flow_id}, version: {snapshot.version}"
            )
            return snapshot
        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when creating snapshot for flow {snapshot.flow_id}: {e}"
            )
            raise ValueError(
                f"Failed to create snapshot due to database integrity error. "
                f"A snapshot with version {snapshot.version} may already exist for this flow."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating snapshot for flow {snapshot.flow_id}: {e}")
            raise e

    def update_snapshot(self, snapshot: FlowSnapshotModel) -> FlowSnapshotModel:
        """
        Update an existing flow snapshot
        """
        try:
            existing_snapshot = (
                self.db_session.query(FlowSnapshotModel)
                .filter_by(id=snapshot.id)
                .first()
            )
            if not existing_snapshot:
                logger.warning(
                    f"Attempted to update non-existent snapshot with ID: {snapshot.id}"
                )
                raise NoResultFound(f"Snapshot with ID {snapshot.id} not found.")

            # Update the existing snapshot's attributes with the new values
            for attr, value in snapshot.__dict__.items():
                if not attr.startswith("_") and hasattr(existing_snapshot, attr):
                    # Skip the primary key and foreign keys if they shouldn't change
                    if attr not in [
                        "id",
                        "flow_id",
                        "version",
                        "created_at",
                    ]:  # Add other fields to skip as needed
                        setattr(existing_snapshot, attr, value)

            self.db_session.commit()
            self.db_session.refresh(existing_snapshot)
            logger.info(f"Updated snapshot with ID: {existing_snapshot.id}")
            return existing_snapshot

        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when updating snapshot with ID {snapshot.id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error updating snapshot with ID {snapshot.id}: {e}")
            raise e

    def delete_snapshot(self, snapshot_id: int) -> None:
        """
        Delete a flow snapshot
        """
        try:
            snapshot = (
                self.db_session.query(FlowSnapshotModel)
                .filter_by(id=snapshot_id)
                .first()
            )
            if not snapshot:
                logger.warning(
                    f"Attempted to delete non-existent snapshot with ID: {snapshot_id}"
                )
                raise NoResultFound(f"Snapshot with ID {snapshot_id} not found.")

            self.db_session.delete(snapshot)
            self.db_session.commit()
            logger.info(f"Deleted snapshot with ID: {snapshot_id}")
        except NoResultFound as e:
            self.db_session.rollback()
            logger.error(
                f"NoResultFound error when deleting snapshot with ID {snapshot_id}: {e}"
            )
            raise e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error deleting snapshot with ID {snapshot_id}: {e}")
            raise e

    def get_next_version(self, flow_id: int) -> int:
        """
        Get the next available version number for a flow snapshot
        """
        try:
            # Get the maximum version number for this flow
            max_version = (
                self.db_session.query(func.max(FlowSnapshotModel.version))
                .filter_by(flow_id=flow_id)
                .scalar()
            )

            # If no snapshots exist, start with version 1
            next_version = (max_version or 0) + 1
            logger.info(f"Next version for flow {flow_id} is {next_version}")
            return next_version
        except Exception as e:
            logger.error(f"Error getting next version for flow {flow_id}: {e}")
            self.db_session.rollback()
            raise e
