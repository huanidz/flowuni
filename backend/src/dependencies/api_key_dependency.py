from fastapi import Depends
from src.dependencies.db_dependency import get_db
from src.repositories.ApiKeyRepository import ApiKeyRepository
from src.services.ApiKeyService import ApiKeyService


def get_api_key_repository(db_session=Depends(get_db)):
    """
    Dependency that returns ApiKeyRepository instance.
    """
    return ApiKeyRepository(db_session=db_session)


def get_api_key_service(api_key_repository=Depends(get_api_key_repository)):
    """
    Dependency that returns ApiKeyService instance.
    """
    return ApiKeyService(api_key_repository=api_key_repository)
