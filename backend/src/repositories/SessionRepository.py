from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.alchemy.session.SessionChatHistoryModel import SessionChatHistoryModel
from src.models.alchemy.session.SessionModel import SessionModel
from src.repositories.BaseRepository import BaseRepository


class SessionRepository(BaseRepository[SessionModel]):
    """
    Repository for Session operations
    """

    def __init__(self):
        super().__init__(SessionModel)
        logger.info("SessionRepository initialized.")

    async def create_session(
        self,
        session: AsyncSession,
        user_defined_session_id: str,
        flow_id: str,
        session_metadata: Optional[dict] = None,
        is_playground: bool = False,
    ) -> SessionModel:
        """
        Create a new session
        """
        try:
            session_obj = SessionModel(
                user_defined_session_id=user_defined_session_id,
                flow_id=flow_id,
                session_metadata=session_metadata or {},
                is_playground=is_playground,
            )

            session.add(session_obj)
            await session.flush()
            await session.refresh(session_obj)
            logger.info(f"Created new session with ID: {user_defined_session_id}")
            return session_obj

        except IntegrityError as e:
            logger.error(f"Integrity error when creating session: {e}")
            raise ValueError(
                "Failed to create session due to database integrity error."
            ) from e
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise e

    async def get_by_user_define_session_id(
        self, session: AsyncSession, session_id: str
    ) -> Optional[SessionModel]:
        """
        Get session by ID
        """
        try:
            result = await session.execute(
                select(SessionModel).where(
                    SessionModel.user_defined_session_id == session_id
                )
            )
            session_obj = result.scalar_one_or_none()
            if session_obj:
                logger.info(f"Retrieved session with ID: {session_id}")
            else:
                logger.info(f"Session with ID: {session_id} not found.")
            return session_obj
        except Exception as e:
            logger.error(f"Error retrieving session by ID {session_id}: {e}")
            raise e

    async def get_by_flow_id(
        self, session: AsyncSession, flow_id: str, is_playground: bool
    ) -> List[SessionModel]:
        """
        Get all sessions for a specific flow
        """
        try:
            result = await session.execute(
                select(SessionModel).where(
                    SessionModel.flow_id == flow_id,
                    SessionModel.is_playground == is_playground,
                )
            )
            sessions = result.scalars().all()
            logger.info(f"Retrieved {len(sessions)} sessions for flow ID: {flow_id}")
            return sessions
        except Exception as e:
            logger.error(f"Error retrieving sessions by flow ID {flow_id}: {e}")
            raise e

    async def update_session_metadata(
        self, session: AsyncSession, session_id: str, metadata: dict
    ) -> Optional[SessionModel]:
        """
        Update session metadata
        """
        try:
            session_obj = await self.get_by_user_define_session_id(session, session_id)
            if not session_obj:
                logger.warning(
                    f"Session with ID {session_id} not found for metadata update"
                )
                return None

            session_obj.session_metadata = metadata
            await session.flush()
            await session.refresh(session_obj)
            logger.info(f"Updated metadata for session with ID: {session_id}")
            return session_obj

        except Exception as e:
            logger.error(f"Error updating metadata for session {session_id}: {e}")
            raise e

    async def add_chat_history(
        self,
        session: AsyncSession,
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

            session.add(chat_history)
            await session.flush()
            await session.refresh(chat_history)
            logger.info(f"Added chat history to session {session_id}")
            return chat_history

        except IntegrityError as e:
            logger.error(
                f"Integrity error when adding chat history to session {session_id}: {e}"
            )
            raise ValueError(
                "Failed to add chat history due to database integrity error."
            ) from e
        except Exception as e:
            logger.error(f"Error adding chat history to session {session_id}: {e}")
            raise e

    async def get_chat_history(
        self,
        session: AsyncSession,
        session_id: str,
        num_messages: Optional[int] = None,
    ) -> List[SessionChatHistoryModel]:
        """
        Get chat history for a session. If num_messages is specified, retrieves the latest N messages.
        Otherwise, gets all chat history like current behavior.
        """  # noqa
        try:
            query = (
                select(SessionChatHistoryModel)
                .where(SessionChatHistoryModel.session_id == session_id)
                .order_by(SessionChatHistoryModel.created_at)
            )

            if num_messages is not None:
                query = query.limit(num_messages)
                result = await session.execute(query)
                chat_histories = result.scalars().all()
                logger.info(
                    f"Retrieved latest {len(chat_histories)} chat entries for session {session_id} (limited to {num_messages})"  # noqa
                )
            else:
                result = await session.execute(query)
                chat_histories = result.scalars().all()
                logger.info(
                    f"Retrieved {len(chat_histories)} chat entries for session {session_id}"  # noqa
                )

            return chat_histories
        except Exception as e:
            logger.error(f"Error retrieving chat history for session {session_id}: {e}")
            raise e

    async def delete_session(self, session: AsyncSession, session_id: str) -> bool:
        """
        Delete a session and all its chat history
        """
        try:
            session_obj = await self.get_by_user_define_session_id(session, session_id)
            if not session_obj:
                logger.warning(
                    f"Attempted to delete non-existent session with ID: {session_id}"
                )
                return False

            await session.delete(session_obj)
            await session.flush()
            logger.info(f"Deleted session with ID: {session_id}")
            return True

        except NoResultFound:
            logger.warning(f"Session with ID {session_id} not found for deletion")
            return False
        except Exception as e:
            logger.error(f"Error deleting session with ID {session_id}: {e}")
            raise e
