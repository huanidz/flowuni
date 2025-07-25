# src/dependencies/auth_dependency.py
from fastapi import Depends, HTTPException, Request, status
from loguru import logger
from src.configs.config import get_settings
from src.dependencies.redis_dependency import get_redis_client
from src.exceptions.user_exceptions import TokenInvalidError
from src.services.AuthService import AuthService


def get_auth_service(redis_client=Depends(get_redis_client)):
    """
    Dependency that returns AuthService instance.
    """

    app_settings = get_settings()
    auth_secret = app_settings.AUTH_SECRET

    if not auth_secret:
        raise ValueError("AUTH_SECRET is not set")

    return AuthService(redis_client=redis_client, secret_key=auth_secret)


def get_current_user(
    request: Request, auth_service: AuthService = Depends(get_auth_service)
) -> int:
    """
    Dependency that extracts and validates JWT from Authorization header.
    Returns user_id if valid and not blacklisted.
    Raises 401 otherwise.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Extract header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise credentials_exception

        token = auth_header.split(" ")[1]  # "Bearer <token>"
        if not token:
            raise credentials_exception

        # Verify token (this raises if invalid/expired)
        user_id = auth_service.verify_token(token)

        # Check if blacklisted
        if auth_service.is_token_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked (logged out)",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user_id  # Can be used in route

    except TokenInvalidError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during auth: {e}")
        raise credentials_exception
