from typing import Any, Dict, Generic, TypeVar, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, db_session: Union[AsyncSession, Session]):
        self.db_session = db_session

    def get(self, id: int) -> Union[ModelType, None]:
        """Get an entity by its ID"""
        return self.db_session.query(self.model).filter(self.model.id == id).first()

    def add(self, entity: ModelType) -> ModelType:
        """Add an entity to the session"""
        self.db_session.add(entity)
        self.db_session.commit()
        self.db_session.refresh(entity)
        return entity

    def update(self, entity: ModelType) -> ModelType:
        """Update an entity"""
        self.db_session.commit()
        self.db_session.refresh(entity)
        return entity

    def delete(self, entity: ModelType) -> None:
        """Delete an entity"""
        self.db_session.delete(entity)
        self.db_session.commit()

    def partial_update(
        self, id: int, update_data: Dict[str, Any]
    ) -> Union[ModelType, None]:
        """Partially update an entity with provided fields"""
        entity = self.get(id)
        if not entity:
            return None

        for key, value in update_data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)

        self.db_session.commit()
        self.db_session.refresh(entity)
        return entity
