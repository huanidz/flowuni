from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import ColumnProperty, RelationshipProperty

Base = declarative_base()


class AppBaseModel(Base):
    """
    Abstract base class for all SQLAlchemy models in the application.

    Contains common columns and methods for all models.
    """

    __abstract__ = True

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    def to_dict(
        self, exclude: Optional[Set[str]] = None, include_relationships: bool = False
    ) -> Dict[str, Any]:
        """
        Convert model to dictionary.

        Args:
            exclude: Set of column names to exclude
            include_relationships: Whether to include relationship data

        Returns:
            Dictionary representation of the model
        """
        exclude = exclude or set()
        result = {}

        # Get all column attributes
        mapper = inspect(self.__class__)

        for attr in mapper.attrs:
            if attr.key in exclude:
                continue

            if isinstance(attr, ColumnProperty):
                value = getattr(self, attr.key)
                result[attr.key] = self._serialize_value(value)
            elif include_relationships and isinstance(attr, RelationshipProperty):
                rel_value = getattr(self, attr.key)
                if rel_value is not None:
                    result[attr.key] = self._serialize_relationship(rel_value)

        return result

    def to_dict_minimal(self, fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Convert model to dictionary with only specified fields.

        Args:
            fields: List of field names to include. If None, includes id and name/title if available

        Returns:
            Minimal dictionary representation
        """
        if fields is None:
            # Default minimal fields
            fields = ["id"]
            # Add common identifying fields if they exist
            for field in ["name", "title", "email", "username"]:
                if hasattr(self, field):
                    fields.append(field)
                    break

        result = {}
        for field in fields:
            if hasattr(self, field):
                value = getattr(self, field)
                result[field] = self._serialize_value(value)

        return result

    def _serialize_value(self, value: Any) -> Any:
        """Serialize individual values for JSON compatibility."""
        if isinstance(value, datetime):
            return value.isoformat()
        elif hasattr(value, "to_dict"):
            return value.to_dict()
        else:
            return value

    def _serialize_relationship(self, rel_value: Any) -> Any:
        """Serialize relationship values."""
        if hasattr(rel_value, "__iter__") and not isinstance(rel_value, (str, bytes)):
            # Collection (one-to-many, many-to-many)
            return [
                item.to_dict_minimal()
                if hasattr(item, "to_dict_minimal")
                else item.to_dict()
                if hasattr(item, "to_dict")
                else str(item)
                for item in rel_value
            ]
        else:
            # Single object (one-to-one, many-to-one)
            if hasattr(rel_value, "to_dict_minimal"):
                return rel_value.to_dict_minimal()
            elif hasattr(rel_value, "to_dict"):
                return rel_value.to_dict()
            else:
                return str(rel_value)

    @classmethod
    def get_column_names(cls) -> List[str]:
        """Get list of all column names for this model."""
        return [column.name for column in cls.__table__.columns]

    @classmethod
    def get_relationship_names(cls) -> List[str]:
        """Get list of all relationship names for this model."""
        mapper = inspect(cls)
        return [
            attr.key for attr in mapper.attrs if isinstance(attr, RelationshipProperty)
        ]
