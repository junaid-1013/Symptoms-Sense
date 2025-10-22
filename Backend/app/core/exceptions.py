"""
Centralized exception handling for the application.
"""
from fastapi import HTTPException, status

class AuthException(HTTPException):
    """Base authentication exception."""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

class InvalidCredentialsException(AuthException):
    """Invalid credentials exception."""
    def __init__(self, detail: str = "Invalid email or password"):
        super().__init__(detail)

class TokenExpiredException(AuthException):
    """Token expired exception."""
    def __init__(self, detail: str = "Token has expired"):
        super().__init__(detail)

class InvalidTokenException(AuthException):
    """Invalid token exception."""
    def __init__(self, detail: str = "Invalid token"):
        super().__init__(detail)

class UserNotFoundException(HTTPException):
    """User not found exception."""
    def __init__(self, detail: str = "User not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

class UserInactiveException(HTTPException):
    """User inactive exception."""
    def __init__(self, detail: str = "User account is inactive"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class UserAlreadyExistsException(HTTPException):
    """User already exists exception."""
    def __init__(self, detail: str = "User with this email already exists"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class InsufficientPermissionsException(HTTPException):
    """Insufficient permissions exception."""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class InvalidPasswordException(HTTPException):
    """Invalid password exception."""
    def __init__(self, detail: str = "Current password is incorrect"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class PasswordResetTokenExpiredException(HTTPException):
    """Password reset token expired exception."""
    def __init__(self, detail: str = "Password reset token has expired"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class GoogleOAuthException(HTTPException):
    """Google OAuth exception."""
    def __init__(self, detail: str = "Google authentication failed"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class ValidationException(HTTPException):
    """Validation exception."""
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )