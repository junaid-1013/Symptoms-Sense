"""
Standardized success response model for the API.
"""
from pydantic import BaseModel
from pydantic.generics import GenericModel
from typing import Any, Optional, Generic, TypeVar


class APIResponse(BaseModel):
    """
    Standardized success response model.

    Attributes:
        status (str): Always "success" for successful responses.
        message (str): A descriptive message about the response.
        data (Optional[Any]): The response data payload. Can be any type.
    """
    status: str = "success"
    message: str
    data: Optional[Any] = None


# Generic API response to enable strong typing in OpenAPI
T = TypeVar("T")


class APIResponseGeneric(GenericModel, Generic[T]):
    status: str = "success"
    message: str
    data: Optional[T] = None
