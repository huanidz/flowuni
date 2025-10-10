from fastapi import Depends
from src.repositories.ApiKeyRepository import ApiKeyRepository
from src.services.ApiKeyService import ApiKeyService


def get_api_key_repository():
    """
    Dependency that returns ApiKeyRepository instance.
    """
    return ApiKeyRepository()


def get_api_key_service(
    api_key_repository: ApiKeyRepository = Depends(get_api_key_repository),
):
    """
    Dependency that returns ApiKeyService instance.
    """
    return ApiKeyService(api_key_repository=api_key_repository)
