from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from loguru import logger
from src.dependencies.auth_dependency import get_auth_service
from src.dependencies.user_dependency import get_user_service
from src.schemas.users.user_schemas import (
    LoginResponse,
    LogoutRequest,
    RegisterResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from src.services.AuthService import AuthService
from src.services.UserService import UserService

auth_router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)


@auth_router.post(
    "/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(
    register_request: UserRegisterRequest,
    user_service: UserService = Depends(get_user_service),
):
    """Register a new user"""
    try:
        registered_user = user_service.register(
            register_request.username, register_request.password
        )

        return RegisterResponse(
            user_id=registered_user.id,
            username=registered_user.username,
            created_at=registered_user.created_at,
        )
    except ValueError as e:
        logger.warning(f"Validation error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Failed to register user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user.",
        ) from e


@auth_router.post(
    "/login", response_model=LoginResponse, status_code=status.HTTP_200_OK
)
async def login_user(
    user: UserLoginRequest,
    user_service: UserService = Depends(get_user_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login a user"""
    try:
        user = user_service.login(username=user.username, password=user.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
            )

        # Generate JWT token
        access_token, refresh_token = auth_service.generate_tokens(user.id)

        return LoginResponse(
            user_id=user.id,
            username=user.username,
            access_token=access_token,
            refresh_token=refresh_token,
        )
    except ValueError as e:
        logger.warning(f"Validation error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Failed to login user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to login user.",
        ) from e


@auth_router.post("/logout")
def logout_user(
    logout_request: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Logout user by blacklisting the refresh token.
    Optionally blacklist access token too.
    """
    try:
        # Blacklist the refresh token
        success = auth_service.blacklist_token(logout_request.refresh_token)

        if success:
            logger.info("User logged out successfully (refresh token blacklisted)")
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "Successfully logged out."},
            )
        else:
            # Could be invalid token, already expired, or malformed
            logger.warning(
                "Logout attempted with invalid or already expired refresh token"
            )
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Invalid or expired refresh token."},
            )
    except ValueError as e:
        logger.warning(f"Validation error during logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log out.",
        ) from e
