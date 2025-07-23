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
    user_id: str
    username: str
    created_at: str


class LoginResponse(BaseModel):
    user_id: str
    username: str
    access_token: str
    refresh_token: str
