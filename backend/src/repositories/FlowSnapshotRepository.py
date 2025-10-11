from typing import List, Optional, Tuple

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.alchemy.flows.FlowSnapshotModel import FlowSnapshotModel
from src.repositories.BaseRepository import BaseRepository


class FlowSnapshotRepository(BaseRepository):
    """
    Flow Snapshot repository
    """

    def __init__(self):
        super().__init__(model=FlowSnapshotModel)
        logger.info("FlowSnapshotRepository initialized.")

    async def get_by_id(
        self, session: AsyncSession, snapshot_id: int
    ) -> Optional[FlowSnapshotModel]:
        """
        Get flow snapshot by id
        """
        try:
            result = await session.execute(
                select(FlowSnapshotModel)
                .options(selectinload(FlowSnapshotModel.flow))
                .where(FlowSnapshotModel.id == snapshot_id)
            )
            snapshot = result.scalar_one_or_none()
            if snapshot:
                logger.info(f"Retrieved flow snapshot with ID: {snapshot_id}")
            else:
                logger.info(f"Flow snapshot with ID: {snapshot_id} not found.")
            return snapshot
        except Exception as e:
            logger.error(f"Error retrieving flow snapshot by ID {snapshot_id}: {e}")
            raise e

    async def get_by_flow_id(
        self, session: AsyncSession, flow_id: int
    ) -> List[FlowSnapshotModel]:
        """
        Get all flow snapshots for a specific flow
        """
        try:
            result = await session.execute(
                select(FlowSnapshotModel)
                .where(FlowSnapshotModel.flow_id == flow_id)
                .order_by(FlowSnapshotModel.version.desc())
            )
            snapshots = result.scalars().all()
            logger.info(f"Retrieved {len(snapshots)} snapshots for flow ID: {flow_id}")
            return snapshots
        except Exception as e:
            logger.error(f"Error retrieving snapshots for flow ID {flow_id}: {e}")
            raise e

    async def get_by_flow_id_paged(
        self,
        session: AsyncSession,
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
            count_result = await session.execute(
                select(func.count(FlowSnapshotModel.id)).where(
                    FlowSnapshotModel.flow_id == flow_id
                )
            )
            total_items = count_result.scalar()

            # 2) paged items
            query = select(FlowSnapshotModel).where(
                FlowSnapshotModel.flow_id == flow_id
            )

            # 3) sort by version descending
            if sort_by_version_desc:
                query = query.order_by(FlowSnapshotModel.version.desc())

            # Apply pagination after ordering
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)

            result = await session.execute(query)
            snapshots = result.scalars().all()

            logger.info(
                f"Flow {flow_id} – page {page}: "
                f"returned {len(snapshots)} of {total_items} total snapshots."
            )
            # return both page of snapshots and metadata
            return snapshots, total_items

        except Exception as e:
            logger.error(f"Error retrieving snapshots for flow ID {flow_id}: {e}")
            raise

    async def get_by_flow_and_version(
        self, session: AsyncSession, flow_id: int, version: int
    ) -> Optional[FlowSnapshotModel]:
        """
        Get a specific snapshot by flow ID and version
        """
        try:
            result = await session.execute(
                select(FlowSnapshotModel)
                .options(selectinload(FlowSnapshotModel.flow))
                .where(
                    FlowSnapshotModel.flow_id == flow_id,
                    FlowSnapshotModel.version == version,
                )
            )
            snapshot = result.scalar_one_or_none()
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
            raise e

    async def get_current_snapshot(
        self, session: AsyncSession, flow_id: int
    ) -> Optional[FlowSnapshotModel]:
        """
        Get the current (latest version) flow snapshot for a specific flow
        """
        try:
            result = await session.execute(
                select(FlowSnapshotModel)
                .options(selectinload(FlowSnapshotModel.flow))
                .where(FlowSnapshotModel.flow_id == flow_id)
                .order_by(FlowSnapshotModel.version.desc())
                .limit(1)
            )
            snapshot = result.scalar_one_or_none()
            if snapshot:
                logger.info(f"Retrieved current snapshot for flow ID: {flow_id}")
            else:
                logger.info(f"No current snapshot found for flow ID: {flow_id}")
            return snapshot
        except Exception as e:
            logger.error(
                f"Error retrieving current snapshot for flow ID {flow_id}: {e}"
            )
            raise e

    async def create_snapshot(
        self, session: AsyncSession, snapshot: FlowSnapshotModel
    ) -> FlowSnapshotModel:
        """
        Create a new flow snapshot
        """
        try:
            session.add(snapshot)
            await session.flush()
            await session.refresh(snapshot)
            logger.info(
                f"Created new snapshot for flow ID: {snapshot.flow_id}, version: {snapshot.version}"
            )
            return snapshot
        except IntegrityError as e:
            logger.error(
                f"Integrity error when creating snapshot for flow {snapshot.flow_id}: {e}"
            )
            raise ValueError(
                f"Failed to create snapshot due to database integrity error. "
                f"A snapshot with version {snapshot.version} may already exist for this flow."
            ) from e
        except Exception as e:
            logger.error(f"Error creating snapshot for flow {snapshot.flow_id}: {e}")
            raise e

    async def update_snapshot(
        self, session: AsyncSession, snapshot: FlowSnapshotModel
    ) -> FlowSnapshotModel:
        """
        Update an existing flow snapshot
        """
        try:
            # Get the existing snapshot
            result = await session.execute(
                select(FlowSnapshotModel).where(FlowSnapshotModel.id == snapshot.id)
            )
            existing_snapshot = result.scalar_one_or_none()
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

            await session.flush()
            await session.refresh(existing_snapshot)
            logger.info(f"Updated snapshot with ID: {existing_snapshot.id}")
            return existing_snapshot

        except NoResultFound as e:
            logger.error(
                f"NoResultFound error when updating snapshot with ID {snapshot.id}: {e}"
            )
            raise e
        except Exception as e:
            logger.error(f"Error updating snapshot with ID {snapshot.id}: {e}")
            raise e

    async def delete_snapshot(self, session: AsyncSession, snapshot_id: int) -> None:
        """
        Delete a flow snapshot
        """
        try:
            result = await session.execute(
                select(FlowSnapshotModel).where(FlowSnapshotModel.id == snapshot_id)
            )
            snapshot = result.scalar_one_or_none()
            if not snapshot:
                logger.warning(
                    f"Attempted to delete non-existent snapshot with ID: {snapshot_id}"
                )
                raise NoResultFound(f"Snapshot with ID {snapshot_id} not found.")

            await session.delete(snapshot)
            await session.flush()
            logger.info(f"Deleted snapshot with ID: {snapshot_id}")
        except NoResultFound as e:
            logger.error(
                f"NoResultFound error when deleting snapshot with ID {snapshot_id}: {e}"
            )
            raise e
        except Exception as e:
            logger.error(f"Error deleting snapshot with ID {snapshot_id}: {e}")
            raise e

    async def get_next_version(self, session: AsyncSession, flow_id: int) -> int:
        """
        Get the next available version number for a flow snapshot
        """
        try:
            # Get the maximum version number for this flow
            result = await session.execute(
                select(func.max(FlowSnapshotModel.version)).where(
                    FlowSnapshotModel.flow_id == flow_id
                )
            )
            max_version = result.scalar()

            # If no snapshots exist, start with version 1
            next_version = (max_version or 0) + 1
            logger.info(f"Next version for flow {flow_id} is {next_version}")
            return next_version
        except Exception as e:
            logger.error(f"Error getting next version for flow {flow_id}: {e}")
            raise e
