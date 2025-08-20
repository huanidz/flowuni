import secrets
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class ApiKeyModel(AppBaseModel):
    """
    API Key model for user authentication
    """

    __tablename__ = "api_keys"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    key_hash = Column(String(255), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)

    # Relationship back to User
    user = relationship("UserModel", back_populates="api_keys")

    def __repr__(self):
        return f"<ApiKeyModel(name={self.name}, user_id={self.user_id}, is_active={self.is_active})>"

    @staticmethod
    def generate_api_key() -> str:
        """Generate a secure API key"""
        return f"sk_{secrets.token_urlsafe(32)}"

    def is_expired(self) -> bool:
        """Check if the API key is expired"""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at

    def can_use(self) -> bool:
        """Check if the API key can be used"""
        return self.is_active and not self.is_deleted and not self.is_expired()
