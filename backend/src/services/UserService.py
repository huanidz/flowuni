from abc import ABC, abstractmethod

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
    def register(self, username: str, password: str) -> bool:
        """Register a new user

        Args:
            username: The username to register
            password: The password to set

        Returns:
            bool: True if registration was successful, False otherwise
        """
        pass

    @abstractmethod
    def login(self, username: str, password: str) -> bool:
        """Login a user

        Args:
            username: The username to login
            password: The password to verify

        Returns:
            bool: True if login was successful, False otherwise
        """
        pass

    @abstractmethod
    def logout(self, username: str) -> bool:
        """Logout a user

        Args:
            username: The username to logout

        Returns:
            bool: True if logout was successful, False otherwise
        """
        pass


class UserService(UserServiceInterface):
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register(self, username: str, password: str) -> bool:
        """Register a new user

        Args:
            username: The username to register
            password: The password to set

        Returns:
            bool: True if registration was successful, False otherwise
        """
        try:
            # Check if user already exists
            existing_user = self.user_repo.get_by_username(username)
            if existing_user:
                logger.warning(f"Registration failed - user already exists: {username}")
                raise UserAlreadyExistsError(username)

            # Create new user
            user = UserModel(username=username)
            user.set_password(password)
            user = self.user_repo.add(user)
            logger.info(f"User registered successfully: {username}")
            return user
        except UserAlreadyExistsError as e:
            logger.warning(f"Registration failed - user already exists: {e.username}")
            raise e
        except Exception as e:
            logger.error(f"Registration error for user {username}: {e}")
            raise UserRegistrationError(
                f"Failed to register user {username}: {e}"
            ) from e

    def login(self, username: str, password: str) -> bool:
        """Login a user

        Args:
            username: The username to login
            password: The password to verify

        Returns:
            bool: True if login was successful, False otherwise
        """
        try:
            user: UserModel = self.user_repo.get_by_username(username)
            if not user:
                logger.warning(f"Login failed - user not found: {username}")
                raise InvalidCredentialsError()

            if user.check_password(password):
                logger.info(f"User logged in successfully: {username}")
                return True

            logger.warning(f"Login failed - incorrect password for user: {username}")
            raise InvalidCredentialsError()
        except InvalidCredentialsError as e:
            logger.info(f"Login error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected login error for user {username}: {e}")
            raise UserLoginError(f"Failed to login user {username}: {e}") from e

    def logout(self, username: str) -> bool:
        """Logout a user

        Args:
            username: The username to logout

        Returns:
            bool: True if logout was successful, False otherwise
        """
        try:
            logger.info(f"User logged out successfully: {username}")
            return True
        except Exception as e:
            logger.error(f"Logout error for user {username}: {e}")
            return False
