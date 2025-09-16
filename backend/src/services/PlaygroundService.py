from abc import ABC, abstractmethod
from typing import Optional
from uuid import uuid4

from loguru import logger
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
    def create_playground_session(
        self, request: CreatePlaygroundSessionRequest
    ) -> PlaygroundSessionResponse:
        """
        Create a new playground session
        """
        pass

    @abstractmethod
    def get_playground_sessions(
        self, request: GetPlaygroundSessionsRequest
    ) -> GetPlaygroundSessionsResponse:
        """
        Get playground sessions for a flow with pagination
        """
        pass

    @abstractmethod
    def get_session_by_id(self, session_id: str) -> Optional[PlaygroundSessionResponse]:
        """
        Get a playground session by ID
        """
        pass

    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a playground session
        """
        pass

    @abstractmethod
    def add_chat_message(self, request: AddChatMessageRequest) -> ChatMessageResponse:
        """
        Add a chat message to a session
        """
        pass

    @abstractmethod
    def get_chat_history(
        self, session_id: str, num_messages: Optional[int] = None
    ) -> GetChatHistoryResponse:
        """
        Get chat history for a session
        """
        pass

    @abstractmethod
    def update_session_metadata(
        self, request: UpdateSessionMetadataRequest
    ) -> UpdateSessionMetadataResponse:
        """
        Update session metadata
        """
        pass

    @abstractmethod
    def get_sessions_with_last_message(
        self, request: GetPlaygroundSessionsRequest
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

    def create_playground_session(
        self, request: CreatePlaygroundSessionRequest
    ) -> PlaygroundSessionResponse:
        """
        Create a new playground session
        """
        try:
            # Generate a unique session ID
            session_id = str(uuid4())

            # Verify the flow exists
            flow = self.flow_repository.get_by_user_define_session_id(request.flow_id)
            if not flow:
                logger.warning(f"Flow with ID {request.flow_id} not found")
                raise ValueError(f"Flow with ID {request.flow_id} not found")

            # Create the session
            session = self.session_repository.create_session(
                user_defined_session_id=session_id,
                flow_id=request.flow_id,
                session_metadata=request.session_metadata,
                is_playground=True,
            )

            logger.info(
                f"Successfully created playground session {session_id} for flow {request.flow_id}"
            )

            return self._map_session_to_response(session)

        except Exception as e:
            logger.error(
                f"Error creating playground session for flow {request.flow_id}: {str(e)}"
            )
            raise

    def get_playground_sessions(
        self, request: GetPlaygroundSessionsRequest
    ) -> GetPlaygroundSessionsResponse:
        """
        Get playground sessions for a flow with pagination
        """
        try:
            # Verify the flow exists
            flow = self.flow_repository.get_by_id(request.flow_id)
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
            all_sessions = self.session_repository.get_by_flow_id(
                flow_id=request.flow_id, is_playground=True
            )

            # Sort by creation time (newest first)
            all_sessions.sort(key=lambda x: x.created_at, reverse=True)

            # Apply pagination
            start_idx = (request.page - 1) * request.per_page
            end_idx = start_idx + request.per_page
            paginated_sessions = all_sessions[start_idx:end_idx]

            # Map to response format
            session_responses = [
                self._map_session_to_response(session) for session in paginated_sessions
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

        except Exception as e:
            logger.error(
                f"Error retrieving playground sessions for flow {request.flow_id}: {str(e)}"
            )
            raise

    def get_session_by_id(self, session_id: str) -> Optional[PlaygroundSessionResponse]:
        """
        Get a playground session by ID
        """
        try:
            session = self.session_repository.get_by_user_define_session_id(session_id)
            if not session or not session.is_playground:
                logger.warning(f"Playground session with ID {session_id} not found")
                return None

            logger.info(f"Retrieved playground session with ID: {session_id}")
            return self._map_session_to_response(session)

        except Exception as e:
            logger.error(f"Error retrieving playground session {session_id}: {str(e)}")
            raise

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a playground session
        """
        try:
            # Verify it's a playground session
            session = self.session_repository.get_by_user_define_session_id(session_id)
            if not session or not session.is_playground:
                logger.warning(f"Playground session with ID {session_id} not found")
                return False

            success = self.session_repository.delete_session(session_id)
            if success:
                logger.info(f"Successfully deleted playground session {session_id}")
            else:
                logger.warning(f"Failed to delete playground session {session_id}")
            return success

        except Exception as e:
            logger.error(f"Error deleting playground session {session_id}: {str(e)}")
            raise

    def add_chat_message(self, request: AddChatMessageRequest) -> ChatMessageResponse:
        """
        Add a chat message to a session
        """
        try:
            # Verify the session exists and is a playground session
            session = self.session_repository.get_by_user_define_session_id(
                request.session_id
            )
            if not session or not session.is_playground:
                logger.warning(
                    f"Playground session with ID {request.session_id} not found"
                )
                raise ValueError(
                    f"Playground session with ID {request.session_id} not found"
                )

            # Add the chat message
            chat_history = self.session_repository.add_chat_history(
                session_id=request.session_id,
                role=request.role,
                message=request.message,
                chat_metadata=request.chat_metadata,
            )

            logger.info(
                f"Added chat message to playground session {request.session_id}"
            )

            return self._map_chat_message_to_response(chat_history)

        except Exception as e:
            logger.error(
                f"Error adding chat message to playground session {request.session_id}: {str(e)}"
            )
            raise

    def get_chat_history(
        self, session_id: str, num_messages: Optional[int] = None
    ) -> GetChatHistoryResponse:
        """
        Get chat history for a session
        """
        try:
            # Verify the session exists and is a playground session
            session = self.session_repository.get_by_user_define_session_id(session_id)
            if not session or not session.is_playground:
                logger.warning(f"Playground session with ID {session_id} not found")
                raise ValueError(f"Playground session with ID {session_id} not found")

            # Get chat history
            chat_histories = self.session_repository.get_chat_history(
                session_id=session_id, num_messages=num_messages
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

        except Exception as e:
            logger.error(
                f"Error retrieving chat history for playground session {session_id}: {str(e)}"
            )
            raise

    def update_session_metadata(
        self, request: UpdateSessionMetadataRequest
    ) -> UpdateSessionMetadataResponse:
        """
        Update session metadata
        """
        try:
            # Verify the session exists and is a playground session
            session = self.session_repository.get_by_user_define_session_id(
                request.session_id
            )
            if not session or not session.is_playground:
                logger.warning(
                    f"Playground session with ID {request.session_id} not found"
                )
                raise ValueError(
                    f"Playground session with ID {request.session_id} not found"
                )

            # Update metadata
            updated_session = self.session_repository.update_session_metadata(
                session_id=request.session_id, metadata=request.metadata
            )

            if not updated_session:
                logger.warning(
                    f"Failed to update metadata for playground session {request.session_id}"
                )
                raise ValueError(
                    f"Failed to update metadata for playground session {request.session_id}"
                )

            logger.info(f"Updated metadata for playground session {request.session_id}")

            return self._map_session_to_update_response(updated_session)

        except Exception as e:
            logger.error(
                f"Error updating metadata for playground session {request.session_id}: {str(e)}"
            )
            raise

    def get_sessions_with_last_message(
        self, request: GetPlaygroundSessionsRequest
    ) -> GetSessionsWithLastMessageResponse:
        """
        Get playground sessions for a flow with their last messages
        """
        try:
            # Verify the flow exists
            flow = self.flow_repository.get_by_id(request.flow_id)
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
            all_sessions = self.session_repository.get_by_flow_id(
                flow_id=request.flow_id, is_playground=True
            )

            # Sort by creation time (newest first)
            all_sessions.sort(key=lambda x: x.created_at, reverse=True)

            # Apply pagination
            start_idx = (request.page - 1) * request.per_page
            end_idx = start_idx + request.per_page
            paginated_sessions = all_sessions[start_idx:end_idx]

            # Map to response format with last message
            session_responses = []
            for session in paginated_sessions:
                # Get the last message for this session
                chat_histories = self.session_repository.get_chat_history(
                    session_id=session.user_defined_session_id, num_messages=1
                )

                last_message = "No messages yet"
                if chat_histories and len(chat_histories) > 0:
                    last_message = chat_histories[0].message

                session_responses.append(
                    {
                        "id": session.user_defined_session_id,
                        "title": f"Session {session.user_defined_session_id[:8]}",
                        "last_message": last_message,
                        "timestamp": session.modified_at.isoformat(),
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

        except Exception as e:
            logger.error(
                f"Error retrieving playground sessions with last messages for flow {request.flow_id}: {str(e)}"
            )
            raise

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
