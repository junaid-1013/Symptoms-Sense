"""
Standardized success response model for the API.
"""
from pydantic import BaseModel
from typing import Any, Optional, Generic, TypeVar

from app.core.constants import ResponseStatus

T = TypeVar("T")


class APIResponse(BaseModel):
    """
    Standardized success response model.

    Attributes:
        status (str): Always "success" for successful responses.
        message (str): A descriptive message about the response.
        data (Optional[Any]): The response data payload. Can be any type.
    """
    status: str = ResponseStatus.SUCCESS
    message: str
    data: Optional[Any] = None


class APIResponseGeneric(BaseModel, Generic[T]):
    """Generic API response for strong typing in OpenAPI."""
    status: str = ResponseStatus.SUCCESS
    message: str
    data: Optional[T] = None
