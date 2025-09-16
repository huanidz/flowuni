from fastapi import Depends, HTTPException, status
from loguru import logger
from sqlalchemy.orm import Session
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_db
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
