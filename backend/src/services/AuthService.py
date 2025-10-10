import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Tuple
from uuid import uuid4

import redis
from jose import JWTError, jwt
from loguru import logger
from src.exceptions.user_exceptions import TokenInvalidError


class AuthServiceInterface(ABC):
    @abstractmethod
    async def generate_tokens(self, user_id: int) -> str:
        pass

    @abstractmethod
    async def verify_token(self, token: str) -> int:
        pass


class AuthService(AuthServiceInterface):
    def __init__(
        self,
        secret_key: str,
        algorithm: "str" = "HS256",
        expires_delta: int = 3600,
        redis_client: redis.Redis = None,
    ):
        """Initialize auth service with security parameters
        Args:
            secret_key (str): JWT secret key
            algorithm (str): JWT algorithm (default HS256)
            expires_delta (int): Token expiration in seconds (default 1 hour)
        """
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.redis = redis_client
        self.expires_in = expires_delta

        if not self.redis:
            raise ValueError("Redis client is required for AuthService")

        self.token_blacklist_prefix = "blacklist:token:"

    async def generate_tokens(self, user_id: int) -> Tuple[str, str]:
        """Generate JWT token for user
        Returns token string or raises error on failure
        """
        try:
            async with asyncio.timeout(30):
                now = datetime.utcnow()

                access_expires = now + timedelta(seconds=self.expires_in)
                refresh_expires = now + timedelta(days=7)

                jti = str(uuid4())
                refresh_jti = str(uuid4())

                access_payload = {
                    "sub": str(user_id),
                    "exp": access_expires,
                    "iat": now,
                    "type": "access",
                    "jti": jti,
                }

                # Refresh token payload
                refresh_payload = {
                    "sub": str(user_id),
                    "exp": refresh_expires,
                    "iat": now,
                    "type": "refresh",
                    "jti": refresh_jti,
                }

                access_token = jwt.encode(
                    access_payload, self.secret_key, algorithm=self.algorithm
                )
                refresh_token = jwt.encode(
                    refresh_payload, self.secret_key, algorithm=self.algorithm
                )

                logger.info(f"Generated token for user {user_id}")
                return access_token, refresh_token
        except asyncio.TimeoutError:
            raise TokenInvalidError("Token generation timed out")
        except Exception as e:
            logger.error(f"Token generation failed: {str(e)}")
            raise TokenInvalidError("Failed to generate token") from e

    async def verify_token(self, access_token: str) -> int:
        """Verify JWT token and return user ID
        Returns user ID if valid, raises TokenInvalidError otherwise
        """
        try:
            async with asyncio.timeout(30):
                payload = jwt.decode(
                    access_token, self.secret_key, algorithms=[self.algorithm]
                )
                user_id = int(payload.get("sub"))
                if not user_id:
                    logger.warning("Token missing subject claim")
                    raise TokenInvalidError("Invalid token structure")
                return user_id
        except asyncio.TimeoutError:
            raise TokenInvalidError("Token verification timed out")
        except JWTError as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise TokenInvalidError("Invalid or expired token") from e

    async def verify_refresh_token(self, refresh_token: str) -> int:
        """Verify JWT refresh token and return user ID
        Returns user ID if valid, raises TokenInvalidError otherwise
        """
        try:
            async with asyncio.timeout(30):
                payload = jwt.decode(
                    refresh_token,
                    self.secret_key,
                    algorithms=[self.algorithm],
                    options={"verify_signature": False},  # Only check local blacklist
                )
                user_id = int(payload.get("sub"))
                if not user_id:
                    logger.warning("Token missing subject claim")
                    raise TokenInvalidError("Invalid token structure")
                return user_id
        except asyncio.TimeoutError:
            raise TokenInvalidError("Refresh token verification timed out")
        except JWTError as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise TokenInvalidError("Invalid or expired token") from e

    async def blacklist_token(self, token: str) -> bool:
        """Blacklist a token in Redis"""
        try:
            async with asyncio.timeout(30):
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=[self.algorithm],
                    options={"verify_exp": False},  # We handle expiry manually
                )
                jti = payload.get("jti")
                exp = payload.get("exp")
                if not jti or not exp:
                    logger.warning("Token missing jti or exp claim")
                    return False

                expiry_time = datetime.fromtimestamp(exp)
                ttl = int((expiry_time - datetime.utcnow()).total_seconds())
                if ttl <= 0:
                    return False

                key = f"{self.token_blacklist_prefix}{jti}"
                self.redis.setex(key, ttl, "blacklisted")
                logger.info(f"Token {jti} blacklisted with TTL: {ttl}s")
                return True
        except asyncio.TimeoutError:
            logger.error("Token blacklisting timed out")
            return False
        except JWTError:
            logger.warning("Invalid token during blacklisting attempt")
            return False

    async def is_token_blacklisted(self, token: str) -> bool:
        """Check if a token is blacklisted"""
        try:
            async with asyncio.timeout(30):
                payload = jwt.decode(
                    token,
                    self.secret_key,
                    algorithms=[self.algorithm],
                    options={"verify_signature": False},  # Only check local blacklist
                )
                jti = payload.get("jti")
                if not jti:
                    return False
                key = f"{self.token_blacklist_prefix}{jti}"
                return bool(self.redis.exists(key))
        except asyncio.TimeoutError:
            logger.error("Token blacklist check timed out")
            return True  # Fail secure
        except JWTError:
            return True  # Optionally treat invalid tokens as blacklisted
