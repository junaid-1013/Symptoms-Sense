"""
Global exception handlers for FastAPI to return consistent JSON responses.
All HTTPException subclasses use the same handler; only RequestValidationError needs a separate one.
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.error_response import APIErrorResponse


def _detail_to_message(detail) -> str:
    """Normalize HTTPException detail (str, list, or dict) to a single message string."""
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list) and detail:
        first = detail[0]
        if isinstance(first, dict):
            msg = first.get("msg", "Invalid input")
            loc = first.get("loc", [])
            field = loc[-1] if loc else "field"
            return f"The field '{field}' {str(msg).lower()}"
        return str(first)
    if isinstance(detail, dict):
        return detail.get("message", detail.get("detail", str(detail)))
    return str(detail) if detail else "An error occurred"


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Global handler for HTTPException and all custom exceptions (they subclass HTTPException).
    Converts any HTTPException to the standardized error response format.
    """
    message = _detail_to_message(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content=APIErrorResponse(message=message).model_dump()
    )


async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors in a standardized format.
    """
    errors = exc.errors()
    if errors:
        first_error = errors[0]
        loc = first_error.get("loc", [])
        field = loc[-1] if loc else "field"
        msg = first_error.get("msg", "Invalid input")
        message = f"The field '{field}' {str(msg).lower()}"
    else:
        message = "Validation error"

    return JSONResponse(
        status_code=422,
        content=APIErrorResponse(message=message).model_dump()
    )


# HTTPException covers all custom exceptions (they subclass it); only RequestValidationError is separate
exception_handlers = {
    HTTPException: http_exception_handler,
    RequestValidationError: request_validation_exception_handler,
}
