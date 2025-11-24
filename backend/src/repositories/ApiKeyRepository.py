import hashlib
from datetime import datetime
from typing import Dict, List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.alchemy.auth.ApiKey import ApiKeyModel
from src.repositories.BaseRepository import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKeyModel]):
    """
    Repository for API Key operations
    """

    def __init__(self):
        super().__init__(ApiKeyModel)
        logger.info("ApiKeyRepository initialized.")

    async def create_api_key(
        self,
        session: AsyncSession,
        user_id: int,
        name: str,
        description: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> tuple[ApiKeyModel, str]:
        """
        Create a new API key for a user with secure key generation
        Returns the created key model and the full key (shown only once)
        """
        try:
            # Generate a secure API key with key_id, full_key, and key_hash
            key_id, full_key, key_hash = ApiKeyModel.generate_api_key()

            api_key = ApiKeyModel(
                user_id=user_id,
                name=name,
                description=description,
                key_id=key_id,
                key_hash=key_hash,
                is_active=True,
                expires_at=expires_at,
            )

            session.add(api_key)
            await session.flush()
            await session.refresh(api_key)

            logger.info(f"Created new API key '{name}' for user ID: {user_id}")
            return api_key, full_key

        except Exception as e:
            logger.error(f"Error creating API key for user {user_id}: {e}")
            raise e

    async def get_api_keys_by_user(
        self, session: AsyncSession, user_id: int
    ) -> List[ApiKeyModel]:
        """
        Get all API keys for a specific user
        """
        try:
            result = await session.execute(
                select(ApiKeyModel).where(ApiKeyModel.user_id == user_id)
            )
            api_keys = result.scalars().all()
            logger.info(f"Retrieved {len(api_keys)} API keys for user ID: {user_id}")
            return api_keys
        except Exception as e:
            logger.error(f"Error retrieving API keys for user ID {user_id}: {e}")
            raise e

    async def get_active_api_keys_by_user(
        self, session: AsyncSession, user_id: int
    ) -> List[ApiKeyModel]:
        """
        Get all active (non-expired, non-deleted) API keys for a specific user
        """
        try:
            current_time = datetime.utcnow()
            result = await session.execute(
                select(ApiKeyModel).where(
                    ApiKeyModel.user_id == user_id,
                    ApiKeyModel.is_active == True,
                    (ApiKeyModel.expires_at.is_(None))
                    | (ApiKeyModel.expires_at > current_time),
                )
            )
            api_keys = result.scalars().all()
            logger.info(
                f"Retrieved {len(api_keys)} active API keys for user ID: {user_id}"
            )
            return api_keys
        except Exception as e:
            logger.error(f"Error retrieving active API keys for user ID {user_id}: {e}")
            raise e

    async def validate_api_key(
        self, session: AsyncSession, api_key_value: str
    ) -> Optional[ApiKeyModel]:
        """
        Validate an API key and return the key model if valid
        Optimized to reduce database writes and combine operations
        """
        try:
            # Hash the provided API key for comparison
            key_hash = hashlib.sha256(api_key_value.encode()).hexdigest()
            current_time = datetime.utcnow()

            # Use a single query with update capability - fetch and update in one operation
            result = await session.execute(
                select(ApiKeyModel)
                .where(
                    ApiKeyModel.key_hash == key_hash,
                    ApiKeyModel.is_active == True,
                    (ApiKeyModel.expires_at.is_(None))
                    | (ApiKeyModel.expires_at > current_time),
                )
                .with_for_update(
                    skip_locked=True
                )  # Add row-level locking with skip locked for better concurrency
            )
            api_key = result.scalar_one_or_none()

            if api_key:
                # Update last used time - only flush once, no refresh needed unless caller specifically needs it
                api_key.last_used_at = current_time
                api_key.modified_at = current_time  # Update modified timestamp
                await session.flush()  # Single flush operation
                logger.info(f"Validated API key for user ID: {api_key.user_id}")
            else:
                logger.warning("Invalid or expired API key provided")

            return api_key

        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            raise e

    async def get_api_key_by_hash(
        self, session: AsyncSession, key_hash: str
    ) -> Optional[ApiKeyModel]:
        """
        Get API key by its hash
        """
        try:
            result = await session.execute(
                select(ApiKeyModel).where(ApiKeyModel.key_hash == key_hash)
            )
            api_key = result.scalar_one_or_none()

            if api_key:
                logger.info(
                    f"Retrieved API key with hash for user ID: {api_key.user_id}"
                )
            else:
                logger.info("API key with provided hash not found")
            return api_key
        except Exception as e:
            logger.error(f"Error retrieving API key by hash: {e}")
            raise e

    async def deactivate_api_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Deactivate an API key by key_id
        """
        try:
            result = await session.execute(
                select(ApiKeyModel).where(ApiKeyModel.key_id == key_id)
            )
            api_key = result.scalar_one_or_none()

            if not api_key:
                logger.warning(
                    f"Attempted to deactivate non-existent API key with key_id: {key_id}"
                )
                return False

            api_key.is_active = False
            await session.flush()
            await session.refresh(api_key)
            logger.info(f"Deactivated API key with key_id: {key_id}")
            return True

        except Exception as e:
            logger.error(f"Error deactivating API key with key_id {key_id}: {e}")
            raise e

    async def activate_api_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Activate an API key by key_id
        """
        try:
            result = await session.execute(
                select(ApiKeyModel).where(ApiKeyModel.key_id == key_id)
            )
            api_key = result.scalar_one_or_none()

            if not api_key:
                logger.warning(
                    f"Attempted to activate non-existent API key with key_id: {key_id}"
                )
                return False

            api_key.is_active = True
            await session.flush()
            await session.refresh(api_key)
            logger.info(f"Activated API key with key_id: {key_id}")
            return True

        except Exception as e:
            logger.error(f"Error activating API key with key_id {key_id}: {e}")
            raise e

    async def delete_api_key(self, session: AsyncSession, key_id: str) -> bool:
        """
        Delete an API key by key_id
        """
        try:
            result = await session.execute(
                select(ApiKeyModel).where(ApiKeyModel.key_id == key_id)
            )
            api_key = result.scalar_one_or_none()

            if not api_key:
                logger.warning(
                    f"Attempted to delete non-existent API key with key_id: {key_id}"
                )
                return False

            await session.delete(api_key)
            await session.flush()
            logger.info(f"Deleted API key with key_id: {key_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting API key with key_id {key_id}: {e}")
            raise e

    async def update_api_key_usage(self, session: AsyncSession, key_id: str) -> bool:
        """
        Update the last used timestamp for an API key
        """
        try:
            result = await session.execute(
                select(ApiKeyModel).where(ApiKeyModel.key_id == key_id)
            )
            api_key = result.scalar_one_or_none()

            if not api_key:
                logger.warning(
                    f"Attempted to update usage for non-existent API key with key_id: {key_id}"
                )
                return False

            api_key.last_used_at = datetime.utcnow()
            await session.flush()
            await session.refresh(api_key)
            logger.info(f"Updated usage timestamp for API key with key_id: {key_id}")
            return True

        except Exception as e:
            logger.error(
                f"Error updating usage timestamp for API key with key_id {key_id}: {e}"
            )
            raise e

    async def batch_deactivate_api_keys(
        self, session: AsyncSession, key_ids: List[str]
    ) -> int:
        """
        Batch deactivate API keys by key_ids
        Returns number of deactivated keys
        """
        try:
            result = await session.execute(
                select(ApiKeyModel)
                .where(ApiKeyModel.key_id.in_(key_ids))
                .with_for_update()
            )
            api_keys = result.scalars().all()

            deactivated_count = 0
            current_time = datetime.utcnow()

            for api_key in api_keys:
                api_key.is_active = False
                api_key.modified_at = current_time
                deactivated_count += 1

            await session.flush()
            logger.info(f"Batch deactivated {deactivated_count} API keys")
            return deactivated_count
        except Exception as e:
            logger.error(f"Error batch deactivating API keys: {e}")
            raise e

    async def batch_activate_api_keys(
        self, session: AsyncSession, key_ids: List[str]
    ) -> int:
        """
        Batch activate API keys by key_ids
        Returns number of activated keys
        """
        try:
            result = await session.execute(
                select(ApiKeyModel)
                .where(ApiKeyModel.key_id.in_(key_ids))
                .with_for_update()
            )
            api_keys = result.scalars().all()

            activated_count = 0
            current_time = datetime.utcnow()

            for api_key in api_keys:
                api_key.is_active = True
                api_key.modified_at = current_time
                activated_count += 1

            await session.flush()
            logger.info(f"Batch activated {activated_count} API keys")
            return activated_count
        except Exception as e:
            logger.error(f"Error batch activating API keys: {e}")
            raise e

    async def batch_delete_api_keys(
        self, session: AsyncSession, key_ids: List[str]
    ) -> int:
        """
        Batch delete API keys by key_ids
        Returns number of deleted keys
        """
        try:
            result = await session.execute(
                select(ApiKeyModel)
                .where(ApiKeyModel.key_id.in_(key_ids))
                .with_for_update()
            )
            api_keys = result.scalars().all()

            deleted_count = 0
            current_time = datetime.utcnow()

            for api_key in api_keys:
                api_key.is_deleted = True
                api_key.is_active = False
                api_key.modified_at = current_time
                deleted_count += 1

            await session.flush()
            logger.info(f"Batch deleted {deleted_count} API keys")
            return deleted_count
        except Exception as e:
            logger.error(f"Error batch deleting API keys: {e}")
            raise e

    async def batch_update_api_key_usage(
        self, session: AsyncSession, key_ids: List[str]
    ) -> int:
        """
        Batch update last used timestamp for API keys
        Returns number of updated keys
        """
        try:
            result = await session.execute(
                select(ApiKeyModel)
                .where(ApiKeyModel.key_id.in_(key_ids))
                .where(ApiKeyModel.is_active == True)
                .with_for_update()
            )
            api_keys = result.scalars().all()

            updated_count = 0
            current_time = datetime.utcnow()

            for api_key in api_keys:
                api_key.last_used_at = current_time
                api_key.modified_at = current_time
                updated_count += 1

            await session.flush()
            logger.info(f"Batch updated usage timestamp for {updated_count} API keys")
            return updated_count
        except Exception as e:
            logger.error(f"Error batch updating API key usage: {e}")
            raise e

    async def get_api_keys_by_user_batch(
        self, session: AsyncSession, user_ids: List[int]
    ) -> Dict[int, List[ApiKeyModel]]:
        """
        Batch get API keys for multiple users
        Returns dictionary mapping user_id to list of API keys
        """
        try:
            result = await session.execute(
                select(ApiKeyModel)
                .where(ApiKeyModel.user_id.in_(user_ids))
                .order_by(ApiKeyModel.created_at.desc())
            )
            all_api_keys = result.scalars().all()

            # Group by user_id
            api_keys_by_user = {}
            for api_key in all_api_keys:
                if api_key.user_id not in api_keys_by_user:
                    api_keys_by_user[api_key.user_id] = []
                api_keys_by_user[api_key.user_id].append(api_key)

            logger.info(f"Retrieved API keys for {len(user_ids)} users")
            return api_keys_by_user
        except Exception as e:
            logger.error(f"Error batch retrieving API keys by users: {e}")
            raise e

    async def get_active_api_keys_by_user_batch(
        self, session: AsyncSession, user_ids: List[int]
    ) -> Dict[int, List[ApiKeyModel]]:
        """
        Batch get active API keys for multiple users
        Returns dictionary mapping user_id to list of active API keys
        """
        try:
            current_time = datetime.utcnow()
            result = await session.execute(
                select(ApiKeyModel)
                .where(
                    ApiKeyModel.user_id.in_(user_ids),
                    ApiKeyModel.is_active == True,
                    (ApiKeyModel.expires_at.is_(None))
                    | (ApiKeyModel.expires_at > current_time),
                )
                .order_by(ApiKeyModel.created_at.desc())
            )
            all_api_keys = result.scalars().all()

            # Group by user_id
            active_api_keys_by_user = {}
            for api_key in all_api_keys:
                if api_key.user_id not in active_api_keys_by_user:
                    active_api_keys_by_user[api_key.user_id] = []
                active_api_keys_by_user[api_key.user_id].append(api_key)

            logger.info(f"Retrieved active API keys for {len(user_ids)} users")
            return active_api_keys_by_user
        except Exception as e:
            logger.error(f"Error batch retrieving active API keys by users: {e}")
            raise e
