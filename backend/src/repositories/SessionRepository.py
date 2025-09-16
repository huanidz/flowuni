from typing import List, Optional

from loguru import logger
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
from src.models.alchemy.session.SessionChatHistoryModel import SessionChatHistoryModel
from src.models.alchemy.session.SessionModel import SessionModel
from src.repositories.BaseRepository import BaseRepository


class SessionRepository(BaseRepository[SessionModel]):
    """
    Repository for Session operations
    """

    def __init__(self, db_session: Session):
        super().__init__(db_session)
        self.model = SessionModel
        logger.info("SessionRepository initialized.")

    def create_session(
        self,
        user_defined_session_id: str,
        flow_id: str,
        session_metadata: Optional[dict] = None,
        is_playground: bool = False,
    ) -> SessionModel:
        """
        Create a new session
        """
        try:
            session = SessionModel(
                user_defined_session_id=user_defined_session_id,
                flow_id=flow_id,
                session_metadata=session_metadata or {},
                is_playground=is_playground,
            )

            created_session = self.add(session)
            logger.info(f"Created new session with ID: {user_defined_session_id}")
            return created_session

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(f"Integrity error when creating session: {e}")
            raise ValueError(
                "Failed to create session due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating session: {e}")
            raise e

    def get_by_user_define_session_id(self, session_id: str) -> Optional[SessionModel]:
        """
        Get session by ID
        """
        try:
            session = (
                self.db_session.query(SessionModel)
                .filter_by(user_defined_session_id=session_id)
                .one_or_none()
            )
            if session:
                logger.info(f"Retrieved session with ID: {session_id}")
            else:
                logger.info(f"Session with ID: {session_id} not found.")
            return session
        except Exception as e:
            logger.error(f"Error retrieving session by ID {session_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_by_flow_id(self, flow_id: str, is_playground: bool) -> List[SessionModel]:
        """
        Get all sessions for a specific flow
        """
        try:
            sessions = (
                self.db_session.query(SessionModel)
                .filter_by(flow_id=flow_id, is_playground=is_playground)
                .all()
            )
            logger.info(f"Retrieved {len(sessions)} sessions for flow ID: {flow_id}")
            return sessions
        except Exception as e:
            logger.error(f"Error retrieving sessions by flow ID {flow_id}: {e}")
            self.db_session.rollback()
            raise e

    def update_session_metadata(
        self, session_id: str, metadata: dict
    ) -> Optional[SessionModel]:
        """
        Update session metadata
        """
        try:
            session = self.get_by_user_define_session_id(session_id)
            if not session:
                logger.warning(
                    f"Session with ID {session_id} not found for metadata update"
                )
                return None

            session.session_metadata = metadata
            updated_session = self.update(session)
            logger.info(f"Updated metadata for session with ID: {session_id}")
            return updated_session

        except Exception as e:
            logger.error(f"Error updating metadata for session {session_id}: {e}")
            self.db_session.rollback()
            raise e

    def add_chat_history(
        self,
        session_id: str,
        role: str,
        message: str,
        chat_metadata: Optional[dict] = None,
    ) -> SessionChatHistoryModel:
        """
        Add a chat history entry to a session
        """
        try:
            chat_history = SessionChatHistoryModel(
                session_id=session_id,
                role=role,
                message=message,
                chat_metadata=chat_metadata or {},
            )

            self.db_session.add(chat_history)
            self.db_session.commit()
            self.db_session.refresh(chat_history)
            logger.info(f"Added chat history to session {session_id}")
            return chat_history

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when adding chat history to session {session_id}: {e}"
            )
            raise ValueError(
                "Failed to add chat history due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error adding chat history to session {session_id}: {e}")
            raise e

    def get_chat_history(
        self, session_id: str, num_messages: Optional[int] = None
    ) -> List[SessionChatHistoryModel]:
        """
        Get chat history for a session. If num_messages is specified, retrieves the latest N messages.
        Otherwise, gets all chat history like current behavior.
        """  # noqa
        try:
            query = (
                self.db_session.query(SessionChatHistoryModel)
                .filter_by(session_id=session_id)
                .order_by(SessionChatHistoryModel.created_at)
            )

            if num_messages is not None:
                chat_histories = query.limit(num_messages).all()
                logger.info(
                    f"Retrieved latest {len(chat_histories)} chat entries for session {session_id} (limited to {num_messages})"  # noqa
                )
            else:
                chat_histories = query.all()
                logger.info(
                    f"Retrieved {len(chat_histories)} chat entries for session {session_id}"  # noqa
                )

            return chat_histories
        except Exception as e:
            logger.error(f"Error retrieving chat history for session {session_id}: {e}")
            self.db_session.rollback()
            raise e

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all its chat history
        """
        try:
            session = self.get_by_user_define_session_id(session_id)
            if not session:
                logger.warning(
                    f"Attempted to delete non-existent session with ID: {session_id}"
                )
                return False

            self.delete(session)
            logger.info(f"Deleted session with ID: {session_id}")
            return True

        except NoResultFound:
            logger.warning(f"Session with ID {session_id} not found for deletion")
            return False
        except Exception as e:
            logger.error(f"Error deleting session with ID {session_id}: {e}")
            self.db_session.rollback()
            raise e
