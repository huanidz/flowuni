from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.alchemy.users.UserModel import UserModel
from src.repositories.BaseRepository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(UserModel)

    async def get_by_username(
        self, session: AsyncSession, username: str
    ) -> Optional[UserModel]:
        """Get user by username"""
        result = await session.execute(
            select(UserModel).where(UserModel.username == username)
        )
        return result.scalar_one_or_none()

    async def add(self, session: AsyncSession, user: UserModel) -> UserModel:
        """Add a new user to the database"""
        session.add(user)
        await session.flush()
        await session.refresh(user)
        return user
