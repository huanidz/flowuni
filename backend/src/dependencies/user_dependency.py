from fastapi import Depends
from src.dependencies.db_dependency import get_db
from src.repositories.UserRepository import UserRepository
from src.services.UserService import UserService


def get_user_repository(db_session=Depends(get_db)):
    """
    Dependency that returns UserRepository instance.
    """
    return UserRepository(db_session=db_session)


def get_user_service(user_repository=Depends(get_user_repository)):
    """
    Dependency that returns UserService instance.
    """
    return UserService(user_repo=user_repository)
