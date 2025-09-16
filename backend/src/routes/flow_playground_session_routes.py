from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.playground_dependency import get_playground_service
from src.schemas.playground.playground_schemas import (
    AddChatMessageRequest,
    ChatMessageResponse,
    CreatePlaygroundSessionRequest,
    GetChatHistoryResponse,
    GetPlaygroundSessionsRequest,
    GetPlaygroundSessionsResponse,
    PlaygroundSessionResponse,
    UpdateSessionMetadataRequest,
    UpdateSessionMetadataResponse,
)

router = APIRouter(prefix="/api/playground", tags=["playground"])


@router.post(
    "/sessions",
    response_model=PlaygroundSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_playground_session(
    request: CreatePlaygroundSessionRequest,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Create a new playground session
    """
    try:
        logger.info(
            f"User {user_id} creating playground session for flow {request.flow_id}"
        )
        return playground_service.create_playground_session(request)
    except ValueError as e:
        logger.warning(f"Validation error creating playground session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error creating playground session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create playground session",
        )


@router.get(
    "/sessions",
    response_model=GetPlaygroundSessionsResponse,
)
def get_playground_sessions(
    flow_id: str,
    page: int = 1,
    per_page: int = 10,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Get playground sessions for a flow with pagination
    """
    try:
        logger.info(f"User {user_id} retrieving playground sessions for flow {flow_id}")
        request = GetPlaygroundSessionsRequest(
            flow_id=flow_id, page=page, per_page=per_page
        )
        return playground_service.get_playground_sessions(request)
    except Exception as e:
        logger.error(
            f"Error retrieving playground sessions for flow {flow_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve playground sessions",
        )


@router.get(
    "/sessions/{session_id}",
    response_model=PlaygroundSessionResponse,
)
def get_playground_session(
    session_id: str,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Get a specific playground session by ID
    """
    try:
        logger.info(f"User {user_id} retrieving playground session {session_id}")
        session = playground_service.get_session_by_id(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playground session not found",
            )

        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving playground session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve playground session",
        )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_playground_session(
    session_id: str,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Delete a playground session
    """
    try:
        logger.info(f"User {user_id} deleting playground session {session_id}")
        success = playground_service.delete_session(session_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playground session not found",
            )

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting playground session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete playground session",
        )


@router.post(
    "/chat",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_chat_message(
    request: AddChatMessageRequest,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Add a chat message to a playground session
    """
    try:
        logger.info(
            f"User {user_id} adding chat message to session {request.session_id}"
        )
        return playground_service.add_chat_message(request)
    except ValueError as e:
        logger.warning(f"Validation error adding chat message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error adding chat message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add chat message",
        )


@router.get(
    "/sessions/{session_id}/chat",
    response_model=GetChatHistoryResponse,
)
def get_chat_history(
    session_id: str,
    num_messages: Optional[int] = None,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Get chat history for a playground session
    """
    try:
        logger.info(f"User {user_id} retrieving chat history for session {session_id}")
        return playground_service.get_chat_history(session_id, num_messages)
    except ValueError as e:
        logger.warning(f"Validation error retrieving chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat history",
        )


@router.put(
    "/sessions/{session_id}/metadata",
    response_model=UpdateSessionMetadataResponse,
)
def update_session_metadata(
    session_id: str,
    metadata: dict,
    user_id: int = Depends(get_current_user),
    playground_service=Depends(get_playground_service),
):
    """
    Update metadata for a playground session
    """
    try:
        logger.info(f"User {user_id} updating metadata for session {session_id}")
        request = UpdateSessionMetadataRequest(session_id=session_id, metadata=metadata)
        return playground_service.update_session_metadata(request)
    except ValueError as e:
        logger.warning(f"Validation error updating session metadata: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error updating session metadata: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session metadata",
        )
