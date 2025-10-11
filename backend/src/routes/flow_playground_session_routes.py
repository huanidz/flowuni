from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.db_dependency import get_async_db
from src.dependencies.playground_dependency import get_playground_service
from src.schemas.playground.playground_schemas import (
    AddChatMessageRequest,
    ChatMessageResponse,
    CreatePlaygroundSessionRequest,
    GetChatHistoryResponse,
    GetPlaygroundSessionsRequest,
    GetPlaygroundSessionsResponse,
    GetSessionsWithLastMessageResponse,
    PlaygroundSessionResponse,
    UpdateSessionMetadataRequest,
    UpdateSessionMetadataResponse,
)

playground_router = APIRouter(prefix="/api/playground", tags=["playground"])


@playground_router.post(
    "/sessions",
    response_model=PlaygroundSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_playground_session(
    request: CreatePlaygroundSessionRequest,
    user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Create a new playground session
    """
    try:
        logger.info(
            f"User {user_id} creating playground session for flow {request.flow_id}"
        )
        return await playground_service.create_playground_session(session, request)
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


@playground_router.get(
    "/sessions",
    response_model=GetPlaygroundSessionsResponse,
)
async def get_playground_sessions(
    flow_id: str = Query(..., description="Flow ID"),
    page: int = Query(1, description="Page number", ge=1),
    per_page: int = Query(10, description="Number of items per page", ge=1, le=100),
    user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
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
        return await playground_service.get_playground_sessions(session, request)
    except Exception as e:
        logger.error(
            f"Error retrieving playground sessions for flow {flow_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve playground sessions",
        )


@playground_router.get(
    "/sessions/{session_id}",
    response_model=PlaygroundSessionResponse,
)
async def get_playground_session(
    session_id: str,
    user_id: int = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Get a specific playground session by ID
    """
    try:
        logger.info(f"User {user_id} retrieving playground session {session_id}")
        session = await playground_service.get_session_by_id(db_session, session_id)

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


@playground_router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_playground_session(
    session_id: str,
    user_id: int = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Delete a playground session
    """
    try:
        logger.info(f"User {user_id} deleting playground session {session_id}")
        success = await playground_service.delete_session(db_session, session_id)

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


@playground_router.post(
    "/chat",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_chat_message(
    request: AddChatMessageRequest,
    user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Add a chat message to a playground session
    """
    try:
        logger.info(
            f"User {user_id} adding chat message to session {request.session_id}"
        )
        return await playground_service.add_chat_message(session, request)
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


@playground_router.get(
    "/sessions/{session_id}/chat",
    response_model=GetChatHistoryResponse,
)
async def get_chat_history(
    session_id: str,
    num_messages: Optional[int] = None,
    user_id: int = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Get chat history for a playground session
    """
    try:
        logger.info(f"User {user_id} retrieving chat history for session {session_id}")
        return await playground_service.get_chat_history(
            db_session, session_id, num_messages
        )
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


@playground_router.put(
    "/sessions/{session_id}/metadata",
    response_model=UpdateSessionMetadataResponse,
)
async def update_session_metadata(
    session_id: str,
    metadata: dict,
    user_id: int = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Update metadata for a playground session
    """
    try:
        logger.info(f"User {user_id} updating metadata for session {session_id}")
        request = UpdateSessionMetadataRequest(session_id=session_id, metadata=metadata)
        return await playground_service.update_session_metadata(db_session, request)
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


@playground_router.get(
    "/sessions-with-last-message",
    response_model=GetSessionsWithLastMessageResponse,
)
async def get_sessions_with_last_message(
    flow_id: str = Query(..., description="Flow ID"),
    page: int = Query(1, description="Page number", ge=1),
    per_page: int = Query(10, description="Number of items per page", ge=1, le=100),
    user_id: int = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_db),
    playground_service=Depends(get_playground_service),
):
    """
    Get playground sessions for a flow with their last messages
    """
    try:
        logger.info(
            f"User {user_id} retrieving playground sessions with last messages for flow {flow_id}"
        )
        request = GetPlaygroundSessionsRequest(
            flow_id=flow_id, page=page, per_page=per_page
        )
        return await playground_service.get_sessions_with_last_message(session, request)
    except Exception as e:
        logger.error(
            f"Error retrieving playground sessions with last messages for flow {flow_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve playground sessions with last messages",
        )
