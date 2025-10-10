from fastapi import Depends
from src.repositories.UserRepository import UserRepository
from src.services.UserService import UserService


def get_user_repository():
    """
    Dependency that returns UserRepository instance.
    """
    return UserRepository()


def get_user_service(user_repository=Depends(get_user_repository)):
    """
    Dependency that returns UserService instance.
    """
    return UserService(user_repo=user_repository)
