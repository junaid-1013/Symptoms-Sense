"""
Authentication dependencies.
"""
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.core.security import SecurityUtils
from app.core.exceptions import InvalidCredentialsException, UserNotFoundException, UserInactiveException
from app.models.user import User
from app.auth.service import AuthService

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token."""
    # if not authorization:
    #     raise InvalidCredentialsException("Missing authorization header")
    
    # if not authorization.startswith("Bearer "):
    #     raise InvalidCredentialsException("Invalid authorization format. Use: Bearer <token>")
    
    # try:
    #     token = authorization.split(" ")[1]
    # except IndexError:
    #     raise InvalidCredentialsException("Invalid authorization format")
    token = credentials.credentials
    # Verify token
    payload = SecurityUtils.verify_token(token, "access")
    if not payload:
        raise InvalidCredentialsException("Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidCredentialsException("Invalid token payload")
    
    # Get user from database
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise UserNotFoundException()
    
    if not user.is_active:
        raise UserInactiveException()
    
    return user