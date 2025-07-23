from abc import ABC, abstractmethod
from typing import Optional

from loguru import logger
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
    def register(self, username: str, password: str) -> UserModel:
        """Register a new user

        Args:
            username: The username to register
            password: The password to set

        Returns:
            UserModel: The newly created user instance
        """
        pass

    @abstractmethod
    def login(self, username: str, password: str) -> Optional[UserModel]:
        """Login a user

        Args:
            username: The username to login
            password: The password to verify

        Returns:
            Optional[UserModel]: The authenticated user if successful, else None
        """
        pass


class UserService(UserServiceInterface):
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register(self, username: str, password: str) -> UserModel:
        try:
            existing_user = self.user_repo.get_by_username(username)
            if existing_user:
                raise UserAlreadyExistsError(username)

            user = UserModel(username=username)
            user.set_password(password)
            user = self.user_repo.add(user)
            logger.info(f"User registered successfully: {username}")
            return user
        except UserAlreadyExistsError:
            logger.warning(f"Registration failed - user already exists: {username}")
            raise
        except Exception as e:
            logger.error(f"Registration error for user {username}: {e}")
            raise UserRegistrationError(
                f"Failed to register user {username}: {e}"
            ) from e

    def login(self, username: str, password: str) -> Optional[UserModel]:
        try:
            user = self.user_repo.get_by_username(username)
            if not user:
                logger.warning(f"Login failed - user not found: {username}")
                raise InvalidCredentialsError()

            if user.check_password(password):
                logger.info(f"User logged in successfully: {username}")
                return user

            logger.warning(f"Login failed - incorrect password for user: {username}")
            raise InvalidCredentialsError()
        except InvalidCredentialsError:
            logger.info("Login error due to invalid credentials")
            raise
        except Exception as e:
            logger.error(f"Unexpected login error for user {username}: {e}")
            raise UserLoginError(f"Failed to login user {username}: {e}") from e
