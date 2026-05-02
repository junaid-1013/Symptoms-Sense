"""
Standardized error response model for the API.
"""
from pydantic import BaseModel
from typing import Optional

from app.core.constants import ResponseStatus


class APIErrorResponse(BaseModel):
    """
    Standardized error response model.

    Attributes:
        status (str): Always "error" for error responses.
        message (str): A descriptive message about the error.
        data (Optional): Always None for error responses.
    """
    status: str = ResponseStatus.ERROR
    message: str
    data: Optional[None] = None
