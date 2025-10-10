from fastapi import Depends
from src.repositories.FlowSnapshotRepository import FlowSnapshotRepository
from src.services.FlowSnapshotService import FlowSnapshotService


# Dependency function for FlowSnapshotRepository
def get_flow_snapshot_repository():
    """
    Dependency that returns FlowSnapshotRepository instance.
    """

    return FlowSnapshotRepository()


# Dependency function for FlowSnapshotService
def get_flow_snapshot_service(
    flow_snapshot_repository=Depends(get_flow_snapshot_repository),
):
    """
    Dependency that returns FlowSnapshotService instance.
    """
    return FlowSnapshotService(snapshot_repository=flow_snapshot_repository)
