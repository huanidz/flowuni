import asyncio
from abc import ABC, abstractmethod
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.configs.config import get_app_settings
from src.models.alchemy.session.SessionChatHistoryModel import SessionChatHistoryModel
from src.models.alchemy.session.SessionModel import SessionModel
from src.repositories.FlowRepositories import FlowRepository
from src.repositories.SessionRepository import SessionRepository
from src.schemas.playground.playground_schemas import (
    AddChatMessageRequest,
    ChatMessageResponse,
    CreatePlaygroundSessionRequest,
    GetChatHistoryResponse,
    GetPlaygroundSessionsRequest,
    GetPlaygroundSessionsResponse,
    GetSessionsWithLastMessageResponse,
    Pagination,
    PlaygroundSessionResponse,
    UpdateSessionMetadataRequest,
    UpdateSessionMetadataResponse,
)


class PlaygroundServiceInterface(ABC):
    """
    Playground service interface
    """

    @abstractmethod
    async def create_playground_session(
        self, session: AsyncSession, request: CreatePlaygroundSessionRequest
    ) -> PlaygroundSessionResponse:
        """
        Create a new playground session
        """
        pass

    @abstractmethod
    async def get_playground_sessions(
        self, session: AsyncSession, request: GetPlaygroundSessionsRequest
    ) -> GetPlaygroundSessionsResponse:
        """
        Get playground sessions for a flow with pagination
        """
        pass

    @abstractmethod
    async def get_session_by_id(
        self, session: AsyncSession, session_id: str
    ) -> Optional[PlaygroundSessionResponse]:
        """
        Get a playground session by ID
        """
        pass

    @abstractmethod
    async def delete_session(self, session: AsyncSession, session_id: str) -> bool:
        """
        Delete a playground session
        """
        pass

    @abstractmethod
    async def add_chat_message(
        self, session: AsyncSession, request: AddChatMessageRequest
    ) -> ChatMessageResponse:
        """
        Add a chat message to a session
        """
        pass

    @abstractmethod
    async def get_chat_history(
        self,
        session: AsyncSession,
        session_id: str,
        num_messages: Optional[int] = None,
    ) -> GetChatHistoryResponse:
        """
        Get chat history for a session
        """
        pass

    @abstractmethod
    async def update_session_metadata(
        self, session: AsyncSession, request: UpdateSessionMetadataRequest
    ) -> UpdateSessionMetadataResponse:
        """
        Update session metadata
        """
        pass

    @abstractmethod
    async def get_sessions_with_last_message(
        self, session: AsyncSession, request: GetPlaygroundSessionsRequest
    ) -> GetSessionsWithLastMessageResponse:
        """
        Get playground sessions for a flow with their last messages
        """
        pass


class PlaygroundService(PlaygroundServiceInterface):
    """
    Playground service implementation
    """

    def __init__(
        self, session_repository: SessionRepository, flow_repository: FlowRepository
    ):
        """
        Initialize playground service with repositories
        """
        self.session_repository = session_repository
        self.flow_repository = flow_repository

    async def create_playground_session(
        self, session: AsyncSession, request: CreatePlaygroundSessionRequest
    ) -> PlaygroundSessionResponse:
        """
        Create a new playground session
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Generate a unique session ID
                    session_id = str(uuid4())

                    # Verify the flow exists
                    flow = await self.flow_repository.get_by_id(
                        session, request.flow_id
                    )
                    if not flow:
                        logger.warning(f"Flow with ID {request.flow_id} not found")
                        raise ValueError(f"Flow with ID {request.flow_id} not found")

                    # Create the session
                    session_obj = await self.session_repository.create_session(
                        session=session,
                        user_defined_session_id=session_id,
                        flow_id=request.flow_id,
                        session_metadata=request.session_metadata,
                        is_playground=True,
                    )

                    logger.info(
                        f"Successfully created playground session {session_id} for flow {request.flow_id}"
                    )

                    return self._map_session_to_response(session_obj)

        except asyncio.TimeoutError:
            logger.error("Timeout creating playground session")
            raise HTTPException(
                status_code=503, detail="Playground session creation timed out"
            )
        except ValueError as e:
            logger.error(f"Validation error creating playground session: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error creating playground session for flow {request.flow_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail="Failed to create playground session"
            )

    async def get_playground_sessions(
        self, session: AsyncSession, request: GetPlaygroundSessionsRequest
    ) -> GetPlaygroundSessionsResponse:
        """
        Get playground sessions for a flow with pagination
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Verify the flow exists
                flow = await self.flow_repository.get_by_id(session, request.flow_id)
                if not flow:
                    logger.info(f"Flow with ID {request.flow_id} not found")
                    return GetPlaygroundSessionsResponse(
                        data=[],
                        pagination=Pagination(
                            page=request.page,
                            page_size=request.per_page,
                            total_pages=0,
                            total_items=0,
                        ),
                    )

                # Get all playground sessions for this flow
                all_sessions = await self.session_repository.get_by_flow_id(
                    session=session, flow_id=request.flow_id, is_playground=True
                )

                # Sort by creation time (newest first)
                all_sessions.sort(key=lambda x: x.created_at, reverse=True)

                # Apply pagination
                start_idx = (request.page - 1) * request.per_page
                end_idx = start_idx + request.per_page
                paginated_sessions = all_sessions[start_idx:end_idx]

                # Map to response format
                session_responses = [
                    self._map_session_to_response(session_obj)
                    for session_obj in paginated_sessions
                ]

                # Calculate pagination metadata
                total_items = len(all_sessions)
                total_pages = (total_items + request.per_page - 1) // request.per_page

                logger.info(
                    f"Retrieved {len(session_responses)} playground sessions for flow {request.flow_id}"
                )

                return GetPlaygroundSessionsResponse(
                    data=session_responses,
                    pagination=Pagination(
                        page=request.page,
                        page_size=request.per_page,
                        total_pages=total_pages,
                        total_items=total_items,
                    ),
                )

        except asyncio.TimeoutError:
            logger.error("Timeout retrieving playground sessions")
            raise HTTPException(
                status_code=503, detail="Playground sessions retrieval timed out"
            )
        except Exception as e:
            logger.error(
                f"Error retrieving playground sessions for flow {request.flow_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail="Failed to retrieve playground sessions"
            )

    async def get_session_by_id(
        self, session: AsyncSession, session_id: str
    ) -> Optional[PlaygroundSessionResponse]:
        """
        Get a playground session by ID
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                session_obj = (
                    await self.session_repository.get_by_user_define_session_id(
                        session, session_id
                    )
                )
                if not session_obj or not session_obj.is_playground:
                    logger.warning(f"Playground session with ID {session_id} not found")
                    return None

                logger.info(f"Retrieved playground session with ID: {session_id}")
                return self._map_session_to_response(session_obj)

        except asyncio.TimeoutError:
            logger.error("Timeout retrieving playground session")
            raise HTTPException(
                status_code=503, detail="Playground session retrieval timed out"
            )
        except Exception as e:
            logger.error(f"Error retrieving playground session {session_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to retrieve playground session"
            )

    async def delete_session(self, session: AsyncSession, session_id: str) -> bool:
        """
        Delete a playground session
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Verify it's a playground session
                    session_obj = (
                        await self.session_repository.get_by_user_define_session_id(
                            session, session_id
                        )
                    )
                    if not session_obj or not session_obj.is_playground:
                        logger.warning(
                            f"Playground session with ID {session_id} not found"
                        )
                        return False

                    success = await self.session_repository.delete_session(
                        session, session_id
                    )
                    if success:
                        logger.info(
                            f"Successfully deleted playground session {session_id}"
                        )
                    else:
                        logger.warning(
                            f"Failed to delete playground session {session_id}"
                        )
                    return success

        except asyncio.TimeoutError:
            logger.error("Timeout deleting playground session")
            raise HTTPException(
                status_code=503, detail="Playground session deletion timed out"
            )
        except Exception as e:
            logger.error(f"Error deleting playground session {session_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to delete playground session"
            )

    async def add_chat_message(
        self, session: AsyncSession, request: AddChatMessageRequest
    ) -> ChatMessageResponse:
        """
        Add a chat message to a session
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Verify the session exists and is a playground session
                    session_obj = (
                        await self.session_repository.get_by_user_define_session_id(
                            session, request.session_id
                        )
                    )
                    if not session_obj or not session_obj.is_playground:
                        logger.warning(
                            f"Playground session with ID {request.session_id} not found"
                        )
                        raise ValueError(
                            f"Playground session with ID {request.session_id} not found"
                        )

                    # Add the chat message
                    chat_history = await self.session_repository.add_chat_history(
                        session=session,
                        session_id=request.session_id,
                        role=request.role,
                        message=request.message,
                        chat_metadata=request.chat_metadata,
                    )

                    logger.info(
                        f"Added chat message to playground session {request.session_id}"
                    )

                    return self._map_chat_message_to_response(chat_history)

        except asyncio.TimeoutError:
            logger.error("Timeout adding chat message")
            raise HTTPException(
                status_code=503, detail="Chat message addition timed out"
            )
        except ValueError as e:
            logger.error(f"Validation error adding chat message: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error adding chat message to playground session {request.session_id}: {str(e)}"
            )
            raise HTTPException(status_code=500, detail="Failed to add chat message")

    async def get_chat_history(
        self,
        session: AsyncSession,
        session_id: str,
        num_messages: Optional[int] = None,
    ) -> GetChatHistoryResponse:
        """
        Get chat history for a session
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Verify the session exists and is a playground session
                session_obj = (
                    await self.session_repository.get_by_user_define_session_id(
                        session, session_id
                    )
                )
                if not session_obj or not session_obj.is_playground:
                    logger.warning(f"Playground session with ID {session_id} not found")
                    raise ValueError(
                        f"Playground session with ID {session_id} not found"
                    )

                # Get chat history
                chat_histories = await self.session_repository.get_chat_history(
                    session=session, session_id=session_id, num_messages=num_messages
                )

                # Map to response format
                message_responses = [
                    self._map_chat_message_to_response(chat) for chat in chat_histories
                ]

                logger.info(
                    f"Retrieved {len(message_responses)} chat messages for playground session {session_id}"
                )

                return GetChatHistoryResponse(
                    session_id=session_id, messages=message_responses
                )

        except asyncio.TimeoutError:
            logger.error("Timeout retrieving chat history")
            raise HTTPException(
                status_code=503, detail="Chat history retrieval timed out"
            )
        except ValueError as e:
            logger.error(f"Validation error retrieving chat history: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error retrieving chat history for playground session {session_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail="Failed to retrieve chat history"
            )

    async def update_session_metadata(
        self, session: AsyncSession, request: UpdateSessionMetadataRequest
    ) -> UpdateSessionMetadataResponse:
        """
        Update session metadata
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                async with session.begin():
                    # Verify the session exists and is a playground session
                    session_obj = (
                        await self.session_repository.get_by_user_define_session_id(
                            session, request.session_id
                        )
                    )
                    if not session_obj or not session_obj.is_playground:
                        logger.warning(
                            f"Playground session with ID {request.session_id} not found"
                        )
                        raise ValueError(
                            f"Playground session with ID {request.session_id} not found"
                        )

                    # Update metadata
                    updated_session = (
                        await self.session_repository.update_session_metadata(
                            session=session,
                            session_id=request.session_id,
                            metadata=request.metadata,
                        )
                    )

                    if not updated_session:
                        logger.warning(
                            f"Failed to update metadata for playground session {request.session_id}"
                        )
                        raise ValueError(
                            f"Failed to update metadata for playground session {request.session_id}"
                        )

                    logger.info(
                        f"Updated metadata for playground session {request.session_id}"
                    )

                    return self._map_session_to_update_response(updated_session)

        except asyncio.TimeoutError:
            logger.error("Timeout updating session metadata")
            raise HTTPException(
                status_code=503, detail="Session metadata update timed out"
            )
        except ValueError as e:
            logger.error(f"Validation error updating session metadata: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(
                f"Error updating metadata for playground session {request.session_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail="Failed to update session metadata"
            )

    async def get_sessions_with_last_message(
        self, session: AsyncSession, request: GetPlaygroundSessionsRequest
    ) -> GetSessionsWithLastMessageResponse:
        """
        Get playground sessions for a flow with their last messages
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Verify the flow exists
                flow = await self.flow_repository.get_by_id(session, request.flow_id)
                if not flow:
                    logger.info(f"Flow with ID {request.flow_id} not found")
                    return GetSessionsWithLastMessageResponse(
                        data=[],
                        pagination=Pagination(
                            page=request.page,
                            page_size=request.per_page,
                            total_pages=0,
                            total_items=0,
                        ),
                    )

                # Get all playground sessions for this flow
                all_sessions = await self.session_repository.get_by_flow_id(
                    session=session, flow_id=request.flow_id, is_playground=True
                )

                # Sort by creation time (newest first)
                all_sessions.sort(key=lambda x: x.created_at, reverse=True)

                # Apply pagination
                start_idx = (request.page - 1) * request.per_page
                end_idx = start_idx + request.per_page
                paginated_sessions = all_sessions[start_idx:end_idx]

                # Map to response format with last message
                session_responses = []
                for session_obj in paginated_sessions:
                    # Get the last message for this session
                    chat_histories = await self.session_repository.get_chat_history(
                        session=session,
                        session_id=session_obj.user_defined_session_id,
                        num_messages=1,
                    )

                    last_message = "No messages yet"
                    if chat_histories and len(chat_histories) > 0:
                        last_message = chat_histories[0].message

                    session_responses.append(
                        {
                            "id": session_obj.user_defined_session_id,
                            "title": f"Session {session_obj.user_defined_session_id[:8]}",
                            "last_message": last_message,
                            "timestamp": session_obj.modified_at.isoformat(),
                        }
                    )

                # Calculate pagination metadata
                total_items = len(all_sessions)
                total_pages = (total_items + request.per_page - 1) // request.per_page

                logger.info(
                    f"Retrieved {len(session_responses)} playground sessions with last messages for flow {request.flow_id}"
                )

                return GetSessionsWithLastMessageResponse(
                    data=session_responses,
                    pagination=Pagination(
                        page=request.page,
                        page_size=request.per_page,
                        total_pages=total_pages,
                        total_items=total_items,
                    ),
                )

        except asyncio.TimeoutError:
            logger.error("Timeout retrieving playground sessions with last messages")
            raise HTTPException(
                status_code=503,
                detail="Playground sessions with last messages retrieval timed out",
            )
        except Exception as e:
            logger.error(
                f"Error retrieving playground sessions with last messages for flow {request.flow_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve playground sessions with last messages",
            )

    def _map_session_to_response(
        self, session: SessionModel
    ) -> PlaygroundSessionResponse:
        """
        Map a SessionModel to a PlaygroundSessionResponse
        """
        return PlaygroundSessionResponse(
            user_defined_session_id=session.user_defined_session_id,
            flow_id=session.flow_id,
            session_metadata=session.session_metadata,
            is_playground=session.is_playground,
            created_at=session.created_at.isoformat(),
            modified_at=session.modified_at.isoformat(),
        )

    def _map_session_to_update_response(
        self, session: SessionModel
    ) -> UpdateSessionMetadataResponse:
        """
        Map a SessionModel to an UpdateSessionMetadataResponse
        """
        return UpdateSessionMetadataResponse(
            user_defined_session_id=session.user_defined_session_id,
            flow_id=session.flow_id,
            session_metadata=session.session_metadata,
            is_playground=session.is_playground,
            created_at=session.created_at.isoformat(),
            modified_at=session.modified_at.isoformat(),
        )

    def _map_chat_message_to_response(
        self, chat: SessionChatHistoryModel
    ) -> ChatMessageResponse:
        """
        Map a SessionChatHistoryModel to a ChatMessageResponse
        """
        return ChatMessageResponse(
            id=str(chat.id),
            session_id=chat.session_id,
            role=chat.role,
            message=chat.message,
            chat_metadata=chat.chat_metadata,
            created_at=chat.created_at.isoformat(),
        )
