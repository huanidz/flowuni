from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Tuple

from jose import JWTError, jwt
from loguru import logger
from src.exceptions.user_exceptions import TokenInvalidError


class AuthServiceInterface(ABC):
    @abstractmethod
    def generate_token(self, user_id: int) -> str:
        pass

    @abstractmethod
    def verify_token(self, token: str) -> bool:
        pass


class AuthService(AuthServiceInterface):
    def __init__(
        self, secret_key: str, algorithm: "str" = "RS256", expires_delta: int = 3600
    ):
        """Initialize auth service with security parameters
        Args:
            secret_key (str): JWT secret key
            algorithm (str): JWT algorithm (default RS256)
            expires_delta (int): Token expiration in seconds (default 1 hour)
        """
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expires_in = expires_delta

    def generate_tokens(self, user_id: int) -> Tuple[str, str]:
        """Generate JWT token for user
        Returns token string or raises error on failure
        """
        try:
            now = datetime.utcnow()

            access_payload = {
                "user_id": user_id,
                "exp": now + timedelta(hours=1),
                "iat": now,
                "type": "access",
            }

            # Refresh token payload
            refresh_payload = {
                "user_id": user_id,
                "exp": now + timedelta(days=1),
                "iat": now,
                "type": "refresh",
            }

            access_token = jwt.encode(
                access_payload, self.secret_key, algorithm="RS256"
            )
            refresh_token = jwt.encode(
                refresh_payload, self.secret_key, algorithm="RS256"
            )

            logger.info(f"Generated token for user {user_id}")
            return access_token, refresh_token
        except Exception as e:
            logger.error(f"Token generation failed: {str(e)}")
            raise TokenInvalidError("Failed to generate token") from e

    def verify_token(self, token: str) -> int:
        """Verify JWT token and return user ID
        Returns user ID if valid, raises TokenInvalidError otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id = int(payload.get("sub"))
            if not user_id:
                logger.warning("Token missing subject claim")
                raise TokenInvalidError("Invalid token structure")
            return user_id
        except JWTError as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise TokenInvalidError("Invalid or expired token") from e
