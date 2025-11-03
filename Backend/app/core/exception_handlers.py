"""
Global exception handlers for FastAPI to return consistent JSON responses.
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.error_response import APIErrorResponse
from app.core.exceptions import (
    AuthException,
    InvalidCredentialsException,
    TokenExpiredException,
    InvalidTokenException,
    UserNotFoundException,
    UserInactiveException,
    UserAlreadyExistsException,
    InsufficientPermissionsException,
    InvalidPasswordException,
    PasswordResetTokenExpiredException,
    GoogleOAuthException,
    ValidationException,
)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Global handler for HTTPException and custom exceptions.

    Converts any HTTPException (including custom ones) to the standardized error response format.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=APIErrorResponse(message=exc.detail).dict()
    )

async def request_validation_exception_handler(request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors in a standardized format.
    Returns a clean, readable error message.
    """
    errors = exc.errors()
    if errors:
        first_error = errors[0]
        loc = first_error.get("loc", [])
        field = loc[-1] if loc else "field"
        msg = first_error.get("msg", "Invalid input")
        message = f"The field '{field}' {msg.lower()}"
    else:
        message = "Validation error"

    return JSONResponse(
        status_code=422,
        content=APIErrorResponse(message=message).dict()
    )



# Register all custom exceptions to use the same handler
exception_handlers = {
    HTTPException: http_exception_handler,
    AuthException: http_exception_handler,
    InvalidCredentialsException: http_exception_handler,
    TokenExpiredException: http_exception_handler,
    InvalidTokenException: http_exception_handler,
    UserNotFoundException: http_exception_handler,
    UserInactiveException: http_exception_handler,
    UserAlreadyExistsException: http_exception_handler,
    InsufficientPermissionsException: http_exception_handler,
    InvalidPasswordException: http_exception_handler,
    PasswordResetTokenExpiredException: http_exception_handler,
    GoogleOAuthException: http_exception_handler,
    ValidationException: http_exception_handler,
    RequestValidationError: request_validation_exception_handler,

}
