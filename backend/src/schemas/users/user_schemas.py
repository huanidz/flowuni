from pydantic import BaseModel


class UserRegisterRequest(BaseModel):
    username: str
    password: str


class UserLoginRequest(BaseModel):
    username: str
    password: str


class LogoutRequest(BaseModel):
    refresh_token: str
