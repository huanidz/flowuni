from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.dependencies.db_dependency import get_async_db
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.FlowSnapshotRepository import FlowSnapshotRepository
from src.repositories.SessionRepository import SessionRepository
from src.services.FlowService import FlowService
from src.services.FlowSnapshotService import FlowSnapshotService


# Dependencies
def get_flow_repository() -> FlowRepository:
    return FlowRepository()


def get_flow_snapshot_repository() -> FlowSnapshotRepository:
    return FlowSnapshotRepository()


def get_flow_session_repository() -> SessionRepository:
    return SessionRepository()


def get_flow_service(flow_repository: FlowRepository = Depends(get_flow_repository)):
    """
    Dependency that returns FlowService instance.
    """
    return FlowService(flow_repository=flow_repository)


def get_flow_snapshot_service(
    flow_snapshot_repository: FlowSnapshotRepository = Depends(
        get_flow_snapshot_repository
    ),
):
    """
    Dependency that returns FlowSnapshotService instance.
    """
    return FlowSnapshotService(snapshot_repository=flow_snapshot_repository)
