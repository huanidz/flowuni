from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response, status
from fastapi.responses import JSONResponse
from loguru import logger
from src.consts.auth_consts import AuthConsts
from src.dependencies.auth_dependency import get_auth_service
from src.dependencies.user_dependency import get_user_service
from src.exceptions.user_exceptions import InvalidCredentialsError
from src.schemas.users.user_schemas import (
    LoginResponse,
    RegisterResponse,
    UserLoginRequest,
    UserRegisterRequest,
    ValidateTokenResponse,
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
    response: Response,
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

        # Generate JWT tokens
        access_token, refresh_token = auth_service.generate_tokens(user.id)

        # Set the refresh token in a secure, HTTP-only cookie
        response.set_cookie(
            key=AuthConsts.REFRESH_TOKEN_COOKIE,
            value=refresh_token,
            httponly=True,
            secure=True,  # Use True in production with HTTPS
            samesite="lax",  # Adjust depending on frontend needs
            max_age=60 * 60 * 24 * 7,  # 7 days
            path="/api/auth/refresh-token",  # Scoped cookie
        )

        return LoginResponse(
            user_id=user.id,
            username=user.username,
            access_token=access_token,
            refresh_token=None,  # Not sent in response body anymore
        )
    except InvalidCredentialsError as e:
        logger.warning(f"Invalid credentials during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
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


@auth_router.get(
    "/validate-token",
    response_model=ValidateTokenResponse,
    status_code=status.HTTP_200_OK,
)
async def validate_token(
    authorization: str = Header(...),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Validate the access token"""
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format.",
            )
        token = authorization.removeprefix("Bearer ").strip()

        user_id = auth_service.verify_token(access_token=token)
        return ValidateTokenResponse(user_id=user_id)
    except ValueError as e:
        logger.warning(f"Validation error during token validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Failed to validate access token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate token.",
        ) from e


@auth_router.post("/logout")
def logout_user(
    refresh_token: str = Cookie(AuthConsts.REFRESH_TOKEN_COOKIE),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Logout user by blacklisting the refresh token stored in the HTTP-only cookie.
    """
    try:
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing refresh token cookie.",
            )

        success = auth_service.blacklist_token(refresh_token)

        if success:
            logger.info("User logged out successfully (refresh token blacklisted)")
            response = JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "Successfully logged out."},
            )
            # Remove cookie by setting it to expire immediately
            response.delete_cookie(
                key=AuthConsts.REFRESH_TOKEN_COOKIE,
                path="/api/auth/refresh-token",  # Must match original cookie path
            )
            return response
        else:
            logger.warning("Logout attempted with invalid or expired refresh token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired refresh token.",
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
