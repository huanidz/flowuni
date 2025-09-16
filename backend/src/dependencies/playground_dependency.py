from fastapi import Depends
from src.dependencies.flow_dep import get_flow_repository, get_flow_session_repository
from src.repositories.SessionRepository import SessionRepository
from src.services.PlaygroundService import PlaygroundService, PlaygroundServiceInterface


def get_playground_service(
    flow_session_repository: SessionRepository = Depends(get_flow_session_repository),
    flow_repository=Depends(get_flow_repository),
) -> PlaygroundServiceInterface:
    """
    Get the playground service from the services container
    """

    playground_service = PlaygroundService(
        session_repository=flow_session_repository,
        flow_repository=flow_repository,
    )

    return playground_service
