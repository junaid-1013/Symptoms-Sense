"""
Authentication controller with FastAPI routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from typing import Optional
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.schema import (
    UserLogin, UserRegister, UserResponse, TokenResponse, 
    RefreshTokenRequest, PasswordResetRequest, PasswordResetConfirm,
    PasswordChange, GoogleAuthRequest, EmailVerificationRequest
)
from app.auth.service import AuthService
from app.models.user import User
from app.core.exceptions import (
    InvalidCredentialsException, UserNotFoundException, UserInactiveException,
    UserAlreadyExistsException, InvalidPasswordException, GoogleOAuthException,
    PasswordResetTokenExpiredException
)
from app.core.security import SecurityUtils
from app.core.response import APIResponse, APIResponseGeneric

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=APIResponseGeneric[dict], status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    auth_service = AuthService(db)
    
    try:
        user, tokens = auth_service.register(user_data)
        return APIResponse(
            message="User registered successfully",
            data={
                "user": UserResponse.model_validate(user),
                "tokens": tokens
            }
        ).dict()
    except UserAlreadyExistsException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=APIResponseGeneric[dict])
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user with email and password."""
    auth_service = AuthService(db)

    try:
        user, tokens = auth_service.login(login_data)
        # Get user-specific response data based on user type
        user_data = auth_service.get_login_response_data(user)
        return APIResponse(
            message="Login successful",
            data={
                "user": user_data,
                "tokens": tokens
            }
        ).dict()
    except (InvalidCredentialsException, UserInactiveException) as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/refresh", response_model=APIResponseGeneric[TokenResponse])
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)
    
    try:
        tokens = auth_service.refresh_access_token(refresh_data.refresh_token)
        return APIResponse(message="Token refreshed", data=tokens).dict()
    except (InvalidCredentialsException, UserNotFoundException, UserInactiveException) as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/logout", response_model=APIResponseGeneric[dict])
async def logout(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Logout user by revoking refresh token."""
    auth_service = AuthService(db)
    
    success = auth_service.logout(refresh_data.refresh_token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid refresh token"
        )
    
    return APIResponse(message="Logout successful").dict()

@router.get("/me", response_model=APIResponseGeneric[UserResponse])
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return APIResponse(message="Current user retrieved", data=UserResponse.model_validate(current_user)).dict()

@router.post("/google", response_model=APIResponseGeneric[dict])
async def google_oauth_login(
    google_data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Login with Google OAuth2."""
    auth_service = AuthService(db)

    try:
        user, tokens = await auth_service.google_oauth_login(google_data.code)
        # Get user-specific response data based on user type
        user_data = auth_service.get_login_response_data(user)
        return APIResponse(
            message="Google login successful",
            data={
                "user": user_data,
                "tokens": tokens
            }
        ).dict()
    except GoogleOAuthException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/google/url", response_model=APIResponseGeneric[dict])
async def get_google_auth_url():
    """Get Google OAuth2 authorization URL."""
    auth_url = SecurityUtils.get_google_auth_url()
    return APIResponse(message="Google auth URL generated", data={"auth_url": auth_url}).dict()

@router.get("/google/callback")
async def google_oauth_callback(code: str, state: Optional[str] = None):
    """Handle Google OAuth2 callback by redirecting to frontend with code."""
    redirect_url = AuthService.build_google_callback_redirect(code, state)
    return RedirectResponse(url=redirect_url, status_code=307)

@router.post("/forgot-password", response_model=APIResponseGeneric[dict])
async def forgot_password(
    password_reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Send password reset email."""
    auth_service = AuthService(db)
    
    token = auth_service.generate_password_reset_token(password_reset_data.email)
    if not token:
        # Don't reveal if email exists or not
        return APIResponse(message="If the email exists, a password reset link has been sent").dict()
    
    # TODO: Send email with reset link
    # For now, return the token (in production, send via email)
    return APIResponse(message="Password reset token generated", data={"token": token}).dict()

@router.post("/reset-password", response_model=APIResponseGeneric[dict])
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password using token."""
    auth_service = AuthService(db)
    
    success = auth_service.reset_password(reset_data.token, reset_data.new_password)
    if not success:
        raise PasswordResetTokenExpiredException()
    
    return APIResponse(message="Password reset successful").dict()

@router.post("/change-password", response_model=APIResponseGeneric[dict])
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    auth_service = AuthService(db)
    
    try:
        success = auth_service.change_password(
            current_user.id, 
            password_data.current_password, 
            password_data.new_password
        )
        if not success:
            raise InvalidPasswordException()
        
        return APIResponse(message="Password changed successfully").dict()
    except InvalidPasswordException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/verify-email", response_model=APIResponseGeneric[dict])
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify user email address."""
    # TODO: Implement email verification logic
    return APIResponse(message="Email verification not implemented yet").dict()

@router.post("/resend-verification", response_model=APIResponseGeneric[dict])
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resend email verification."""
    # TODO: Implement resend verification logic
    return APIResponse(message="Resend verification not implemented yet").dict()
