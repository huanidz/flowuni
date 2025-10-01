from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from loguru import logger
from src.models.alchemy.auth.ApiKey import ApiKeyModel
from src.repositories.ApiKeyRepository import ApiKeyRepository


class ApiKeyServiceInterface(ABC):
    """
    API Key service interface
    """

    @abstractmethod
    def issue_new_key(
        self,
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
    def delete_key(self, key_id: str) -> bool:
        """
        Delete an API key by key_id
        """
        pass

    @abstractmethod
    def deactivate_key(self, key_id: str) -> bool:
        """
        Deactivate an API key by key_id
        """
        pass

    @abstractmethod
    def activate_key(self, key_id: str) -> bool:
        """
        Activate an API key by key_id
        """
        pass

    @abstractmethod
    def validate_key(self, api_key_value: str) -> Optional[ApiKeyModel]:
        """
        Validate an API key and return the key model if valid
        """
        pass

    @abstractmethod
    def list_api_keys(
        self, user_id: int, include_inactive: bool = False
    ) -> list[ApiKeyModel]:
        """
        List all API keys for a specific user
        """
        pass

    @abstractmethod
    def set_last_used_at(self, key_id: str) -> bool:
        """
        Update the last used timestamp for an API key
        """
        pass


class ApiKeyService(ApiKeyServiceInterface):
    """
    API Key service implementation
    """

    def __init__(self, api_key_repository: ApiKeyRepository):
        """
        Initialize API key service with repository
        """
        self.api_key_repository = api_key_repository

    def issue_new_key(
        self,
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
            # Create the API key in the database and get both model and full key
            api_key_model, full_key = self.api_key_repository.create_api_key(
                user_id=user_id,
                name=name,
                description=description,
                expires_at=expires_at,
            )

            logger.info(f"Successfully issued new API key '{name}' for user {user_id}")
            return full_key, api_key_model

        except Exception as e:
            logger.error(f"Error issuing new API key for user {user_id}: {str(e)}")
            raise

    def delete_key(self, key_id: str) -> bool:
        """
        Delete an API key by key_id
        """
        try:
            success = self.api_key_repository.delete_api_key(key_id)
            if success:
                logger.info(f"Successfully deleted API key with key_id: {key_id}")
            else:
                logger.warning(
                    f"Failed to delete API key with key_id: {key_id} (key not found)"
                )
            return success
        except Exception as e:
            logger.error(f"Error deleting API key with key_id {key_id}: {str(e)}")
            raise

    def deactivate_key(self, key_id: str) -> bool:
        """
        Deactivate an API key by key_id
        """
        try:
            success = self.api_key_repository.deactivate_api_key(key_id)
            if success:
                logger.info(f"Successfully deactivated API key with key_id: {key_id}")
            else:
                logger.warning(
                    f"Failed to deactivate API key with key_id: {key_id} (key not found)"
                )
            return success
        except Exception as e:
            logger.error(f"Error deactivating API key with key_id {key_id}: {str(e)}")
            raise

    def activate_key(self, key_id: str) -> bool:
        """
        Activate an API key by key_id
        """
        try:
            success = self.api_key_repository.activate_api_key(key_id)
            if success:
                logger.info(f"Successfully activated API key with key_id: {key_id}")
            else:
                logger.warning(
                    f"Failed to activate API key with key_id: {key_id} (key not found)"
                )
            return success
        except Exception as e:
            logger.error(f"Error activating API key with key_id {key_id}: {str(e)}")
            raise

    def validate_key(self, api_key_value: str) -> Optional[ApiKeyModel]:
        """
        Validate an API key and return the key model if valid
        """
        try:
            api_key_model = self.api_key_repository.validate_api_key(api_key_value)
            if api_key_model:
                logger.info(
                    f"Successfully validated API key for user {api_key_model.user_id}"
                )
            else:
                logger.warning("API key validation failed - invalid or expired key")
            return api_key_model
        except Exception as e:
            logger.error(f"Error validating API key: {str(e)}")
            raise

    def list_api_keys(
        self, user_id: int, include_inactive: bool = False
    ) -> list[ApiKeyModel]:
        """
        List all API keys for a specific user
        """
        try:
            if include_inactive:
                api_keys = self.api_key_repository.get_api_keys_by_user(user_id)
                logger.info(
                    f"Retrieved {len(api_keys)} API keys (including inactive) for user {user_id}"
                )
            else:
                api_keys = self.api_key_repository.get_active_api_keys_by_user(user_id)
                logger.info(
                    f"Retrieved {len(api_keys)} active API keys for user {user_id}"
                )

            return api_keys
        except Exception as e:
            logger.error(f"Error listing API keys for user {user_id}: {str(e)}")
            raise

    def set_last_used_at(self, key_id: str) -> bool:
        """
        Update the last used timestamp for an API key
        """
        try:
            success = self.api_key_repository.update_api_key_usage(key_id)
            if success:
                logger.info(
                    f"Successfully updated last_used_at for API key with key_id: {key_id}"
                )
            else:
                logger.warning(
                    f"Failed to update last_used_at for API key with key_id: {key_id} (key not found)"
                )
            return success
        except Exception as e:
            logger.error(
                f"Error updating last_used_at for API key with key_id {key_id}: {str(e)}"
            )
            raise
