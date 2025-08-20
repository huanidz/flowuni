from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from src.dependencies.api_key_dependency import get_api_key_service
from src.dependencies.auth_dependency import get_current_user
from src.schemas.api_keys.api_key_schemas import (
    ApiKeyInfoResponse,
    ApiKeyListResponse,
    ApiKeyResponse,
    CreateApiKeyRequest,
    ValidateApiKeyRequest,
    ValidateApiKeyResponse,
)
from src.services.ApiKeyService import ApiKeyService

api_key_router = APIRouter(
    prefix="/api/api-keys",
    tags=["api_keys"],
)


@api_key_router.post(
    "/", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED
)
async def create_api_key(
    request: CreateApiKeyRequest,
    api_key_service: ApiKeyService = Depends(get_api_key_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Create a new API key for the authenticated user
    """
    try:
        # Issue new API key
        full_key, api_key_model = api_key_service.issue_new_key(
            user_id=auth_user_id,
            name=request.name,
            description=request.description,
            expires_at=request.expires_at,
        )

        response = ApiKeyResponse(
            key_id=api_key_model.key_id,
            name=api_key_model.name,
            description=api_key_model.description,
            key=full_key,  # Only returned on creation
            created_at=api_key_model.created_at,
            expires_at=api_key_model.expires_at,
        )

        return response

    except Exception as e:
        logger.error(f"Error creating API key for user {auth_user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create API key.",
        ) from e


@api_key_router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: str,
    api_key_service: ApiKeyService = Depends(get_api_key_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Delete an API key by key_id
    """
    try:
        success = api_key_service.delete_key(key_id)

        if not success:
            logger.warning(f"API key with key_id {key_id} not found for deletion")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found.",
            )

        # Return empty response for 204 No Content
        return

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key {key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API key.",
        ) from e


@api_key_router.patch("/{key_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_api_key(
    key_id: str,
    api_key_service: ApiKeyService = Depends(get_api_key_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    Deactivate an API key by key_id
    """
    try:
        success = api_key_service.deactivate_key(key_id)

        if not success:
            logger.warning(f"API key with key_id {key_id} not found for deactivation")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found.",
            )

        return {"message": "API key deactivated successfully."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating API key {key_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate API key.",
        ) from e


@api_key_router.post(
    "/validate", response_model=ValidateApiKeyResponse, status_code=status.HTTP_200_OK
)
async def validate_api_key(
    request: ValidateApiKeyRequest,
    api_key_service: ApiKeyService = Depends(get_api_key_service),
):
    """
    Validate an API key and return its information
    """
    try:
        api_key_model = api_key_service.validate_key(request.api_key)

        if api_key_model:
            response = ValidateApiKeyResponse(
                valid=True,
                user_id=api_key_model.user_id,
                key_id=api_key_model.key_id,
                name=api_key_model.name,
            )
        else:
            response = ValidateApiKeyResponse(
                valid=False,
                user_id=None,
                key_id=None,
                name=None,
            )

        return response

    except Exception as e:
        logger.error(f"Error validating API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate API key.",
        ) from e


@api_key_router.get(
    "/", response_model=ApiKeyListResponse, status_code=status.HTTP_200_OK
)
async def list_api_keys(
    include_inactive: bool = False,
    api_key_service: ApiKeyService = Depends(get_api_key_service),
    auth_user_id: int = Depends(get_current_user),
):
    """
    List all API keys for the authenticated user
    """
    try:
        api_keys = api_key_service.list_api_keys(
            user_id=auth_user_id, include_inactive=include_inactive
        )

        # Convert to response format
        api_key_responses = [
            ApiKeyInfoResponse(
                key_id=api_key.key_id,
                name=api_key.name,
                description=api_key.description,
                is_active=api_key.is_active,
                created_at=api_key.created_at,
                expires_at=api_key.expires_at,
                last_used_at=api_key.last_used_at,
            )
            for api_key in api_keys
        ]

        response = ApiKeyListResponse(api_keys=api_key_responses)
        return response

    except Exception as e:
        logger.error(f"Error listing API keys for user {auth_user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list API keys.",
        ) from e
