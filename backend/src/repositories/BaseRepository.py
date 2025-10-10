from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get_by_id(self, session: AsyncSession, id: int) -> Optional[ModelType]:
        """Get an entity by its ID"""
        result = await session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self, session: AsyncSession, limit: int = 100, offset: int = 0
    ) -> List[ModelType]:
        """Get all entities with pagination"""
        result = await session.execute(select(self.model).limit(limit).offset(offset))
        return result.scalars().all()

    async def create(self, session: AsyncSession, **kwargs) -> ModelType:
        """Create a new entity"""
        instance = self.model(**kwargs)
        session.add(instance)
        await session.flush()
        await session.refresh(instance)
        return instance

    async def update(
        self, session: AsyncSession, id: int, update_data: Dict[str, Any]
    ) -> Optional[ModelType]:
        """Update an entity by ID"""
        result = await session.execute(select(self.model).where(self.model.id == id))
        entity = result.scalar_one_or_none()
        if not entity:
            return None

        for key, value in update_data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)

        await session.flush()
        await session.refresh(entity)
        return entity

    async def delete(self, session: AsyncSession, id: int) -> bool:
        """Delete an entity by ID"""
        result = await session.execute(select(self.model).where(self.model.id == id))
        entity = result.scalar_one_or_none()
        if not entity:
            return False

        await session.delete(entity)
        await session.flush()
        return True

    async def count(self, session: AsyncSession) -> int:
        """Count all entities"""
        result = await session.execute(select(func.count()).select_from(self.model))
        return result.scalar()

    async def exists(self, session: AsyncSession, id: int) -> bool:
        """Check if entity exists"""
        result = await session.execute(
            select(self.model.id).where(self.model.id == id).limit(1)
        )
        return result.scalar_one_or_none() is not None
