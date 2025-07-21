from datetime import datetime
import uuid
from sqlalchemy import Column, BigInteger, Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class AppBaseModel(Base):
    """
    Abstract base class for all SQLAlchemy models in the application.

    Contains common columns and methods for all models.
    """

    __abstract__ = True  # Chỉ định model này không tạo bảng trong DB

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False, unique=True)
    is_deleted = Column(Boolean, default=False)
    time_created = Column(DateTime, default=datetime.utcnow)
    time_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
