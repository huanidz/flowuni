from fastapi import Depends
from sqlalchemy.orm import Session
from src.dependencies.db_dependency import get_db
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.FlowSnapshotRepository import FlowSnapshotRepository
from src.repositories.SessionRepository import SessionRepository
from src.services.FlowService import FlowService
from src.services.FlowSnapshotService import FlowSnapshotService


# Dependencies
def get_flow_repository(db_session: Session = Depends(get_db)) -> FlowRepository:
    return FlowRepository(db_session=db_session)


def get_flow_snapshot_repository(
    db_session: Session = Depends(get_db),
) -> FlowSnapshotRepository:
    return FlowSnapshotRepository(db_session=db_session)


def get_flow_session_repository(
    db_session: Session = Depends(get_db),
) -> SessionRepository:
    return SessionRepository(db_session=db_session)


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
