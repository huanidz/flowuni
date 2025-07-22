from typing import Any, Callable

from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from loguru import logger

from backend.src.services.AuthService import AuthService

# Define the OAuth2 scheme for Bearer token authentication
# This will be used to extract the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def token_required(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator to ensure a route is protected by Bearer token authentication.

    This decorator checks for a valid Bearer token in the Authorization header.
    If the token is missing or invalid, it raises an HTTPException.
    """

    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            # Attempt to get the token using the OAuth2PasswordBearer scheme
            token: str = await oauth2_scheme()
            logger.info(
                f"Received token: {token[:10]}..."
            )  # Log first 10 chars of token

            # Validate the token using AuthService
            # Assuming AuthService.verify_token returns user data or raises an exception
            user = await AuthService.verify_token(token)
            logger.info(
                f"Token verified for user: {user.username if user else 'Unknown'}"
            )

            # If token is valid, proceed to call the decorated function
            # You might want to pass the user object to the decorated function
            # For now, we just ensure authentication is successful
            return await func(*args, **kwargs)

        except HTTPException as e:
            logger.error(f"Authentication failed: {e.detail}")
            raise e  # Re-raise the HTTPException to be handled by FastAPI
        except Exception as e:
            logger.error(f"An unexpected error occurred during token verification: {e}")
            # Catch any other unexpected errors during token verification
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An internal error occurred during authentication.",
            )

    # Preserve original function's metadata
    from functools import wraps

    return wraps(func)(wrapper)


# Example of how this decorator might be used (for illustration,
# not part of the decorator itself)
# @app.get("/protected")
# @token_required
# async def protected_route(current_user: UserModel = Depends(get_current_user)):
# # Assuming get_current_user uses the token
#     return {"message": "This is a protected route", "user": current_user.username}
