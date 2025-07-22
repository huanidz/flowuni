class UserAlreadyExistsError(Exception):
    """Exception raised when a user with the given username already exists."""

    def __init__(self, username: str):
        self.username = username
        super().__init__(f"User with username '{username}' already exists.")


class InvalidCredentialsError(Exception):
    """Exception raised for invalid login credentials."""

    def __init__(self):
        super().__init__("Invalid username or password.")


class UserRegistrationError(Exception):
    """Generic exception raised for user registration failures."""

    def __init__(self, message="User registration failed."):
        super().__init__(message)


class UserLoginError(Exception):
    """Generic exception raised for user login failures."""

    def __init__(self, message="User login failed."):
        super().__init__(message)


class TokenInvalidError(Exception):
    """Exception raised for invalid or expired tokens."""

    def __init__(self, message="Invalid or expired token."):
        super().__init__(message)
