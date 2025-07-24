from datetime import datetime

from pydantic import BaseModel


class UserRegisterRequest(BaseModel):
    username: str
    password: str


class UserLoginRequest(BaseModel):
    username: str
    password: str


class LogoutRequest(BaseModel):
    refresh_token: str


class RegisterResponse(BaseModel):
    user_id: int
    username: str
    created_at: datetime


class LoginResponse(BaseModel):
    user_id: int
    username: str
    access_token: str


class ValidateTokenResponse(BaseModel):
    user_id: int
