from datetime import datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import Session
from src.models.alchemy.auth.ApiKey import ApiKeyModel
from src.repositories.BaseRepository import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKeyModel]):
    """
    Repository for API Key operations
    """

    def __init__(self, db_session: Session):
        super().__init__(db_session)
        self.model = ApiKeyModel
        logger.info("ApiKeyRepository initialized.")

    def create_api_key(
        self,
        user_id: int,
        name: str,
        description: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> ApiKeyModel:
        """
        Create a new API key for a user with secure key generation
        """
        try:
            # Generate a secure API key
            api_key_value = ApiKeyModel.generate_api_key()

            # Hash the key for storage (you might want to use a proper hashing function)
            # For now, we'll store it as-is, but in production you should hash it
            key_hash = api_key_value  # TODO: Implement proper hashing

            api_key = ApiKeyModel(
                user_id=user_id,
                name=name,
                description=description,
                key_hash=key_hash,
                is_active=True,
                expires_at=expires_at,
            )

            created_key = self.add(api_key)
            logger.info(f"Created new API key '{name}' for user ID: {user_id}")
            return created_key

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(
                f"Integrity error when creating API key for user {user_id}: {e}"
            )
            raise ValueError(
                "Failed to create API key due to database integrity error."
            ) from e
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Error creating API key for user {user_id}: {e}")
            raise e

    def get_api_keys_by_user(self, user_id: int) -> List[ApiKeyModel]:
        """
        Get all API keys for a specific user
        """
        try:
            api_keys = (
                self.db_session.query(ApiKeyModel).filter_by(user_id=user_id).all()
            )
            logger.info(f"Retrieved {len(api_keys)} API keys for user ID: {user_id}")
            return api_keys
        except Exception as e:
            logger.error(f"Error retrieving API keys for user ID {user_id}: {e}")
            self.db_session.rollback()
            raise e

    def get_active_api_keys_by_user(self, user_id: int) -> List[ApiKeyModel]:
        """
        Get all active (non-expired, non-deleted) API keys for a specific user
        """
        try:
            current_time = datetime.utcnow()
            api_keys = (
                self.db_session.query(ApiKeyModel)
                .filter_by(user_id=user_id, is_active=True)
                .filter(
                    (ApiKeyModel.expires_at.is_(None))
                    | (ApiKeyModel.expires_at > current_time)
                )
                .all()
            )
            logger.info(
                f"Retrieved {len(api_keys)} active API keys for user ID: {user_id}"
            )
            return api_keys
        except Exception as e:
            logger.error(f"Error retrieving active API keys for user ID {user_id}: {e}")
            self.db_session.rollback()
            raise e

    def validate_api_key(self, api_key_value: str) -> Optional[ApiKeyModel]:
        """
        Validate an API key and return the key model if valid
        """
        try:
            # TODO: Implement proper key hashing comparison
            # For now, we're comparing plain text
            current_time = datetime.utcnow()

            api_key = (
                self.db_session.query(ApiKeyModel)
                .filter_by(key_hash=api_key_value, is_active=True)
                .filter(
                    (ApiKeyModel.expires_at.is_(None))
                    | (ApiKeyModel.expires_at > current_time)
                )
                .first()
            )

            if api_key:
                # Update last used time
                api_key.last_used_at = current_time
                self.db_session.commit()
                self.db_session.refresh(api_key)
                logger.info(f"Validated API key for user ID: {api_key.user_id}")
            else:
                logger.warning("Invalid or expired API key provided")

            return api_key

        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            self.db_session.rollback()
            raise e

    def get_api_key_by_hash(self, key_hash: str) -> Optional[ApiKeyModel]:
        """
        Get API key by its hash
        """
        try:
            api_key = (
                self.db_session.query(ApiKeyModel).filter_by(key_hash=key_hash).first()
            )
            if api_key:
                logger.info(
                    f"Retrieved API key with hash for user ID: {api_key.user_id}"
                )
            else:
                logger.info("API key with provided hash not found")
            return api_key
        except Exception as e:
            logger.error(f"Error retrieving API key by hash: {e}")
            self.db_session.rollback()
            raise e

    def deactivate_api_key(self, api_key_id: int) -> bool:
        """
        Deactivate an API key by ID
        """
        try:
            api_key = self.get(api_key_id)
            if not api_key:
                logger.warning(
                    f"Attempted to deactivate non-existent API key with ID: {api_key_id}"
                )
                return False

            api_key.is_active = False
            self.update(api_key)
            logger.info(f"Deactivated API key with ID: {api_key_id}")
            return True

        except Exception as e:
            logger.error(f"Error deactivating API key with ID {api_key_id}: {e}")
            self.db_session.rollback()
            raise e

    def delete_api_key(self, api_key_id: int) -> bool:
        """
        Delete an API key by ID
        """
        try:
            api_key = self.get(api_key_id)
            if not api_key:
                logger.warning(
                    f"Attempted to delete non-existent API key with ID: {api_key_id}"
                )
                return False

            self.delete(api_key)
            logger.info(f"Deleted API key with ID: {api_key_id}")
            return True

        except NoResultFound:
            logger.warning(f"API key with ID {api_key_id} not found for deletion")
            return False
        except Exception as e:
            logger.error(f"Error deleting API key with ID {api_key_id}: {e}")
            self.db_session.rollback()
            raise e

    def update_api_key_usage(self, api_key_id: int) -> bool:
        """
        Update the last used timestamp for an API key
        """
        try:
            api_key = self.get(api_key_id)
            if not api_key:
                logger.warning(
                    f"Attempted to update usage for non-existent API key with ID: {api_key_id}"
                )
                return False

            api_key.last_used_at = datetime.utcnow()
            self.update(api_key)
            logger.info(f"Updated usage timestamp for API key with ID: {api_key_id}")
            return True

        except Exception as e:
            logger.error(
                f"Error updating usage timestamp for API key with ID {api_key_id}: {e}"
            )
            self.db_session.rollback()
            raise e
