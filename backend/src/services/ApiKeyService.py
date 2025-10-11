import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from src.configs.config import get_app_settings
from src.models.alchemy.auth.ApiKey import ApiKeyModel
from src.repositories.ApiKeyRepository import ApiKeyRepository


class ApiKeyServiceInterface(ABC):
    """
    API Key service interface
    """

    @abstractmethod
    async def issue_new_key(
        self,
        session: AsyncSession,
        user_id: int,
        name: str,
        description: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> tuple[str, ApiKeyModel]:
        """
        Issue a new API key for a user
        Returns the full key (only shown once) and the key model
        """
        pass

    @abstractmethod
    async def delete_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Delete an API key by key_id
        """
        pass

    @abstractmethod
    async def deactivate_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Deactivate an API key by key_id
        """
        pass

    @abstractmethod
    async def activate_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Activate an API key by key_id
        """
        pass

    @abstractmethod
    async def validate_key(
        self, session: AsyncSession, api_key_value: str
    ) -> Optional[ApiKeyModel]:
        """
        Validate an API key and return the key model if valid
        """
        pass

    @abstractmethod
    async def list_api_keys(
        self, session: AsyncSession, user_id: int, include_inactive: bool = False
    ) -> list[ApiKeyModel]:
        """
        List all API keys for a specific user
        """
        pass

    @abstractmethod
    async def set_last_used_at(self, session: AsyncSession, key_id: str) -> bool:
        """
        Update the last used timestamp for an API key
        """
        pass


class ApiKeyService(ApiKeyServiceInterface):
    """
    API Key service implementation
    """

    def __init__(self, api_key_repository: ApiKeyRepository | None = None):
        """
        Initialize API key service with repository
        """
        self.api_key_repository = api_key_repository or ApiKeyRepository()

    async def issue_new_key(
        self,
        session: AsyncSession,
        user_id: int,
        name: str,
        description: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> tuple[str, ApiKeyModel]:
        """
        Issue a new API key for a user
        Returns the full key (only shown once) and the key model
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # Create the API key in the database and get both model and full key
                (
                    api_key_model,
                    full_key,
                ) = await self.api_key_repository.create_api_key(
                    session=session,
                    user_id=user_id,
                    name=name,
                    description=description,
                    expires_at=expires_at,
                )

                logger.info(
                    f"Successfully issued new API key '{name}' for user {user_id}"
                )
                return full_key, api_key_model
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error issuing new API key for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to issue API key: {str(e)}"
            )

    async def delete_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Delete an API key by key_id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                success = await self.api_key_repository.delete_api_key(session, key_id)
                if success:
                    logger.info(f"Successfully deleted API key with key_id: {key_id}")
                else:
                    logger.warning(
                        f"Failed to delete API key with key_id: {key_id} (key not found)"
                    )
                return success
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error deleting API key with key_id {key_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to delete API key: {str(e)}"
            )

    async def deactivate_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Deactivate an API key by key_id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                success = await self.api_key_repository.deactivate_api_key(
                    session, key_id
                )
                if success:
                    logger.info(
                        f"Successfully deactivated API key with key_id: {key_id}"
                    )
                else:
                    logger.warning(
                        f"Failed to deactivate API key with key_id: {key_id} (key not found)"
                    )
                return success
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error deactivating API key with key_id {key_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to deactivate API key: {str(e)}"
            )

    async def activate_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Activate an API key by key_id
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                success = await self.api_key_repository.activate_api_key(
                    session, key_id
                )
                if success:
                    logger.info(f"Successfully activated API key with key_id: {key_id}")
                else:
                    logger.warning(
                        f"Failed to activate API key with key_id: {key_id} (key not found)"
                    )
                return success
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error activating API key with key_id {key_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to activate API key: {str(e)}"
            )

    async def validate_key(
        self, session: AsyncSession, api_key_value: str
    ) -> Optional[ApiKeyModel]:
        """
        Validate an API key and return the key model if valid
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                # This is a read operation with a write (update last_used_at), so we need a transaction

                api_key_model = await self.api_key_repository.validate_api_key(
                    session, api_key_value
                )
                if api_key_model:
                    logger.info(
                        f"Successfully validated API key for user {api_key_model.user_id}"
                    )
                else:
                    logger.warning("API key validation failed - invalid or expired key")
                return api_key_model
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error validating API key: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"API key validation failed: {str(e)}"
            )

    async def list_api_keys(
        self, session: AsyncSession, user_id: int, include_inactive: bool = False
    ) -> list[ApiKeyModel]:
        """
        List all API keys for a specific user
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                if include_inactive:
                    api_keys = await self.api_key_repository.get_api_keys_by_user(
                        session, user_id
                    )
                    logger.info(
                        f"Retrieved {len(api_keys)} API keys (including inactive) for user {user_id}"
                    )
                else:
                    api_keys = (
                        await self.api_key_repository.get_active_api_keys_by_user(
                            session, user_id
                        )
                    )
                    logger.info(
                        f"Retrieved {len(api_keys)} active API keys for user {user_id}"
                    )

                return api_keys
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(f"Error listing API keys for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to list API keys: {str(e)}"
            )

    async def set_last_used_at(self, session: AsyncSession, key_id: str) -> bool:
        """
        Update the last used timestamp for an API key
        """
        try:
            async with asyncio.timeout(get_app_settings().QUERY_TIMEOUT):
                success = await self.api_key_repository.update_api_key_usage(
                    session, key_id
                )
                if success:
                    logger.info(
                        f"Successfully updated last_used_at for API key with key_id: {key_id}"
                    )
                else:
                    logger.warning(
                        f"Failed to update last_used_at for API key with key_id: {key_id} (key not found)"
                    )
                return success
        except asyncio.TimeoutError:
            raise HTTPException(status_code=503, detail="Database operation timed out")
        except Exception as e:
            logger.error(
                f"Error updating last_used_at for API key with key_id {key_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=500, detail=f"Failed to update API key usage: {str(e)}"
            )
