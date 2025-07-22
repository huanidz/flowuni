from abc import ABC, abstractmethod

from src.models.alchemy.users.UserModel import UserModel
from src.repositories.UserRepository import UserRepository


class UserServiceInterface(ABC):
    @abstractmethod
    def register(self, username: str, password: str) -> bool:
        pass

    @abstractmethod
    def login(self, username: str, password: str) -> bool:
        pass


class UserService(UserServiceInterface):
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register(self, username: str, password: str) -> bool:
        """Register a new user"""
        try:
            user = UserModel(username=username)
            user.set_password(password)
            self.user_repo.add(user)
            return True
        except Exception as e:
            # Log the exception here if needed
            print(f"Error during registration: {e}")
            return False

    def login(self, username: str, password: str) -> bool:
        """Login a user"""
        try:
            user = self.user_repo.get_by_username(username)
            if user and user.check_password(password):
                return True
            return False
        except Exception as e:
            # Log the exception here if needed
            print(f"Error during login: {e}")
            return False
