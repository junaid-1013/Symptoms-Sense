"""
Contact-form request/response schemas.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator

class ContactRequest(BaseModel):
    """Payload for POST /api/contact."""
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., description="Pakistan mobile number, format 03XXXXXXXXX")
    subject: str = Field(..., min_length=5, max_length=100)
    message: str = Field(..., min_length=20, max_length=500)

    @field_validator("name")
    @classmethod
    def _name_letters_only(cls, value: str) -> str:
        if not all(ch.isalpha() or ch.isspace() for ch in value):
            raise ValueError("must contain only letters and spaces")
        return value.strip()

    @field_validator("phone")
    @classmethod
    def _phone_format(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) != 11 or not cleaned.startswith("03") or not cleaned.isdigit():
            raise ValueError("must be a valid phone number in the format 03XXXXXXXXX")
        return cleaned

    @field_validator("subject", "message")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()