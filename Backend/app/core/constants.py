"""
Application-wide constants to avoid magic strings and duplication.
"""

# User types (must match User.user_type and role checks)
class UserType:
    PATIENT = "patient"
    DOCTOR = "doctor"
    CLINIC = "clinic"
    ADMIN = "admin"


# API response status (for consistent JSON shape)
class ResponseStatus:
    SUCCESS = "success"
    ERROR = "error"
