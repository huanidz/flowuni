import bcrypt
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from src.models.alchemy.shared.AppBaseModel import AppBaseModel


class UserModel(AppBaseModel):
    __tablename__ = "users"

    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    # Relationships
    flows = relationship("FlowModel", back_populates="user")
    api_keys = relationship("ApiKeyModel", back_populates="user")

    def set_password(self, password):
        """Hash and set password"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode(
            "utf-8"
        )

    def check_password(self, password):
        """Check if provided password matches hash"""
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )
