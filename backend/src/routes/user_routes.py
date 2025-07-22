from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from loguru import logger
from src.dependencies.auth_dependency import get_auth_service
from src.dependencies.user_dependency import get_user_service
from src.models.alchemy.users.UserModel import UserModel
from src.schemas.users.user_schemas import LogoutRequest, UserLogin, UserRegister
from src.services.AuthService import AuthService
from src.services.UserService import UserService

user_router = APIRouter()


@user_router.post("/register", response_model=UserModel)
def register_user(
    request: Request, user_service: UserService = Depends(get_user_service)
):
    """Register a new user"""
    try:
        request_data = request.json()

        user_request = UserRegister(request_data)

        registered_user = user_service.register(
            user_request.username, user_request.password
        )

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "id": registered_user.id,
                "username": registered_user.username,
                "created_at": registered_user.created_at.isoformat(),
            },
        )
    except Exception as e:
        logger.error(f"Failed to register user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user.",
        ) from e


@user_router.post("/login", response_model=UserModel)
def login_user(
    user: UserLogin,
    user_service: UserService = Depends(get_user_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login a user"""
    try:
        user = user_service.login(user.username, user.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
            )

        # Generate JWT token
        access_token, refresh_token = auth_service.generate_tokens(user.id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "id": user.id,
                "username": user.username,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "created_at": user.created_at.isoformat(),
            },
        )
    except Exception as e:
        logger.error(f"Failed to login user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to login user.",
        ) from e


@user_router.post("/logout")
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
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log out.",
        ) from e
