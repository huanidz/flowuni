from datetime import datetime

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.ext.declarative import declarative_base

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
