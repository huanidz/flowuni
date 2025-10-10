import asyncio
from abc import ABC, abstractmethod
from typing import Optional

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.exceptions.user_exceptions import (
    InvalidCredentialsError,
    UserAlreadyExistsError,
    UserLoginError,
    UserRegistrationError,
)
from src.models.alchemy.users.UserModel import UserModel
from src.repositories.UserRepository import UserRepository


class UserServiceInterface(ABC):
    @abstractmethod
    async def register(
        self, session: AsyncSession, username: str, password: str
    ) -> UserModel:
        """Register a new user

        Args:
            session: AsyncSession for database operations
            username: The username to register
            password: The password to set

        Returns:
            UserModel: The newly created user instance
        """
        pass

    @abstractmethod
    async def login(
        self, session: AsyncSession, username: str, password: str
    ) -> Optional[UserModel]:
        """Login a user

        Args:
            session: AsyncSession for database operations
            username: The username to login
            password: The password to verify

        Returns:
            Optional[UserModel]: The authenticated user if successful, else None
        """
        pass


class UserService(UserServiceInterface):
    def __init__(self, user_repo: UserRepository | None = None):
        self.user_repo = user_repo or UserRepository()

    async def register(
        self, session: AsyncSession, username: str, password: str
    ) -> UserModel:
        """Register a new user with transaction management"""
        try:
            async with asyncio.timeout(30):
                async with session.begin():  # Transaction for write operation
                    existing_user = await self.user_repo.get_by_username(
                        session, username
                    )
                    if existing_user:
                        raise UserAlreadyExistsError(username)

                    user = UserModel(username=username)
                    user.set_password(password)
                    user = await self.user_repo.add(session, user)
                    logger.info(f"User registered successfully: {username}")
                    return user
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="User registration timed out")
        except UserAlreadyExistsError:
            logger.warning(f"Registration failed - user already exists: {username}")
            raise HTTPException(
                status_code=400, detail=f"User {username} already exists"
            )
        except Exception as e:
            logger.error(f"Registration error for user {username}: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to register user {username}: {str(e)}"
            ) from e

    async def login(
        self, session: AsyncSession, username: str, password: str
    ) -> Optional[UserModel]:
        """Login a user - read operation, no transaction needed"""
        try:
            async with asyncio.timeout(30):
                user = await self.user_repo.get_by_username(session, username)
                if not user:
                    logger.warning(f"Login failed - user not found: {username}")
                    raise InvalidCredentialsError()

                if user.check_password(password):
                    logger.info(f"User logged in successfully: {username}")
                    return user

                logger.warning(
                    f"Login failed - incorrect password for user: {username}"
                )
                raise InvalidCredentialsError()
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="User login timed out")
        except InvalidCredentialsError:
            logger.info("Login error due to invalid credentials")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        except Exception as e:
            logger.error(f"Unexpected login error for user {username}: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to login user {username}: {str(e)}"
            ) from e
