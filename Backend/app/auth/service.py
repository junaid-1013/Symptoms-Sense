"""
Authentication service for business logic.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.constants import UserType
from app.core.security import SecurityUtils
from app.core.exceptions import (
    InvalidCredentialsException, UserNotFoundException, UserInactiveException,
    UserAlreadyExistsException, InvalidPasswordException, GoogleOAuthException
)
from app.models.user import User, RefreshToken
from app.auth.schema import UserRegister, UserLogin, TokenResponse, PatientLoginResponse, DoctorLoginResponse, ClinicLoginResponse
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.clinic import Clinic
from app.prescriptions.service import PrescriptionService
from app.prescriptions.schema import MedicineResponse
from sqlalchemy.orm import joinedload
from app.core.config import config
from app.clinics.service import ClinicsService
class AuthService:
    """Authentication service class."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None)
        ).first()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()
    
    def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID."""
        return self.db.query(User).filter(
            User.google_id == google_id,
            User.deleted_at.is_(None)
        ).first()
    
    def create_user(self, user_data: UserRegister) -> User:
        """Create a new user."""
        hashed_password = SecurityUtils.get_password_hash(user_data.password)
        
        user = User(
            email=user_data.email,
            password=hashed_password,
            name=user_data.name,
            phone=user_data.phone,
            user_type=user_data.user_type,
            is_email_verified=False
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = self.get_user_by_email(email)
        if not user or not user.password:
            return None
        if not SecurityUtils.verify_password(password, user.password):
            return None
        return user
    
    def login(self, login_data: UserLogin) -> Tuple[User, TokenResponse]:
        """Login a user and return tokens."""
        user = self.authenticate_user(login_data.email, login_data.password)
        if not user:
            raise InvalidCredentialsException()

        if not user.is_active:
            raise UserInactiveException()

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()

        # Create tokens
        access_token = SecurityUtils.create_access_token({"sub": user.id, "email": user.email})
        refresh_token = SecurityUtils.create_refresh_token({"sub": user.id})

        self.store_refresh_token(user.id, refresh_token)

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        return user, token_response

    def get_login_response_data(self, user: User):
        """Get login response data based on user type."""
        if user.user_type == UserType.PATIENT:
            patient = self.db.query(Patient).filter(Patient.user_id == user.id).first()
            if patient:
                return PatientLoginResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    phone=user.phone,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_email_verified=user.is_email_verified,
                    avatar_url=user.avatar_url,
                    last_login=user.last_login,
                    patient_id=patient.id,
                    age=patient.age,
                    gender=patient.gender,
                    blood_group=patient.blood_group,
                    emergency_contact=patient.emergency_contact,
                    address=patient.address
                )
            else:
                return PatientLoginResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    phone=user.phone,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_email_verified=user.is_email_verified,
                    avatar_url=user.avatar_url,
                    last_login=user.last_login
                )

        elif user.user_type == UserType.DOCTOR:
            prescription_svc = PrescriptionService(self.db)
            medicines = [MedicineResponse.model_validate(m) for m in prescription_svc.list_all_active_medicines()]

            doctor = self.db.query(Doctor).options(
                joinedload(Doctor.clinic).joinedload(Clinic.user)
            ).filter(Doctor.user_id == user.id).first()
            
            if doctor:
                clinic_name = doctor.clinic.user.name if doctor.clinic else None
                clinic_address = doctor.clinic.address if doctor.clinic else None
                return DoctorLoginResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    phone=user.phone,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_email_verified=user.is_email_verified,
                    avatar_url=user.avatar_url,
                    last_login=user.last_login,
                    doctor_id=doctor.id,
                    specializations=doctor.specializations,
                    services=doctor.services,
                    education=doctor.education,
                    experience=doctor.experience,
                    license_no=doctor.license_no,
                    experience_years=doctor.experience_years,
                    bio=doctor.bio,
                    clinic_id=doctor.clinic_id,
                    clinic_name=clinic_name,
                    clinic_address=clinic_address,
                    status=doctor.status,
                    medicines=medicines
                )
            else:
                return DoctorLoginResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    phone=user.phone,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_email_verified=user.is_email_verified,
                    avatar_url=user.avatar_url,
                    last_login=user.last_login,
                    medicines=medicines
                )

        elif user.user_type == UserType.CLINIC:
            prescription_svc = PrescriptionService(self.db)
            medicines = [MedicineResponse.model_validate(m) for m in prescription_svc.list_all_active_medicines()]

            clinic = self.db.query(Clinic).filter(Clinic.user_id == user.id).first()
            if clinic:
                clinics_service = ClinicsService(self.db)
                clinic_doctors = clinics_service.get_all_clinic_doctors_basic(clinic.id)
                clinic_doctors_data = {
                    "doctors": [doctor.model_dump() for doctor in clinic_doctors],
                }
                return ClinicLoginResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    phone=user.phone,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_email_verified=user.is_email_verified,
                    avatar_url=user.avatar_url,
                    last_login=user.last_login,
                    clinic_id=clinic.id,
                    address=clinic.address,
                    registration_no=clinic.registration_no,
                    established_year=clinic.established_year,
                    total_doctors=clinic.total_doctors,
                    status=clinic.status,
                    clinic_doctors=clinic_doctors_data,
                    medicines=medicines
                )
            else:
                return ClinicLoginResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    phone=user.phone,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_email_verified=user.is_email_verified,
                    avatar_url=user.avatar_url,
                    last_login=user.last_login,
                    medicines=medicines
                )

        else:
            from app.auth.schema import UserResponse
            return UserResponse.model_validate(user)
    
    def register(self, user_data: UserRegister) -> Tuple[User, TokenResponse]:
        """Register a new user and return tokens."""
        # Check if user already exists
        existing_user = self.get_user_by_email(user_data.email)
        if existing_user:
            raise UserAlreadyExistsException()
        
        # Create user
        user = self.create_user(user_data)
        
        # Create tokens
        access_token = SecurityUtils.create_access_token({"sub": user.id, "email": user.email})
        refresh_token = SecurityUtils.create_refresh_token({"sub": user.id})
        
        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        # Store refresh token in database
        self.store_refresh_token(user.id, refresh_token)
        
        return user, token_response
    
    def store_refresh_token(self, user_id: str, token: str) -> None:
        """Store refresh token in database."""
        # Create new refresh token
        expires_at = datetime.now(timezone.utc) + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        
        self.db.add(refresh_token)
        self.db.commit()
    
    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token."""
        # Verify refresh token
        payload = SecurityUtils.verify_token(refresh_token, "refresh")
        if not payload:
            raise InvalidCredentialsException("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidCredentialsException("Invalid refresh token")
        
        # Check if refresh token exists and is valid in database
        db_token = self.db.query(RefreshToken).filter(
            and_(
                RefreshToken.token == refresh_token,
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        ).first()
        
        if not db_token:
            raise InvalidCredentialsException("Invalid refresh token")
        
        # Get user
        user = self.get_user_by_id(user_id) 
        if not user:
            raise UserNotFoundException()
        
        if not user.is_active:
            raise UserInactiveException()
        
        # Create new access token
        access_token = SecurityUtils.create_access_token({"sub": user.id, "email": user.email})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    async def google_oauth_login(self, code: str) -> Tuple[User, TokenResponse]:
        """Handle Google OAuth login."""
        # Exchange code for token
        token_data = await SecurityUtils.exchange_google_code(code)
        if not token_data:
            raise GoogleOAuthException()
        
        # Get user info from Google
        user_info = await SecurityUtils.get_google_user_info(token_data["access_token"])
        if not user_info:
            raise GoogleOAuthException()
        
        google_id = user_info["id"]
        email = user_info["email"]
        name = user_info["name"]
        avatar_url = user_info.get("picture")
        
        # Check if user exists
        user = self.get_user_by_google_id(google_id)
        if not user:
            # Check if user exists with this email
            user = self.get_user_by_email(email)
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.avatar_url = avatar_url
                user.is_email_verified = True
            else:
                # Create new user
                user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    avatar_url=avatar_url,
                    is_email_verified=True,
                    user_type=UserType.PATIENT  # Default user type for OAuth users
                )
                self.db.add(user)
        else:
            # Update user info
            user.avatar_url = avatar_url
            user.last_login = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(user)
        
        if not user.is_active:
            raise UserInactiveException()
        
        # Create tokens
        access_token = SecurityUtils.create_access_token({"sub": user.id, "email": user.email})
        refresh_token = SecurityUtils.create_refresh_token({"sub": user.id})
        
        # Store refresh token in database
        self.store_refresh_token(user.id, refresh_token)
        
        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return user, token_response
    
    def generate_password_reset_token(self, email: str) -> Optional[str]:
        """Generate password reset token."""
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        # Generate random token
        token = SecurityUtils.generate_random_token(32)
        
        # Store token in database
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        self.db.commit()
        
        return token
    
    def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token."""
        user = self.db.query(User).filter(
            User.password_reset_token == token,
            User.password_reset_expires > datetime.now(timezone.utc),
            User.deleted_at.is_(None)
        ).first()
        
        if not user:
            return False
        
        # Update password
        user.password = SecurityUtils.get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        self.db.commit()
        
        return True
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password."""
        user = self.get_user_by_id(user_id)
        if not user or not user.password:
            return False
        
        if not SecurityUtils.verify_password(current_password, user.password):
            raise InvalidPasswordException()
        
        user.password = SecurityUtils.get_password_hash(new_password)
        self.db.commit()
        
        return True
    
    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """Revoke a refresh token."""
        db_token = self.db.query(RefreshToken).filter(
            and_(
                RefreshToken.token == refresh_token,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
        ).first()
        
        if db_token:
            db_token.is_revoked = True
            self.db.commit()
            return True
        return False
    
    def logout(self, refresh_token: str) -> bool:
        """Logout user by revoking refresh token."""
        return self.revoke_refresh_token(refresh_token)
    
    def logout_all_devices(self, user_id: str) -> bool:
        """Logout user from all devices by revoking all refresh tokens."""
        try:
            self.db.query(RefreshToken).filter(
                and_(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
            ).update({"is_revoked": True})
            self.db.commit()
            return True
        except Exception:
            return False

    @staticmethod
    def build_google_callback_redirect(code: str, state: Optional[str] = None) -> str:
        """Build the frontend redirect URL for Google OAuth callback."""
        frontend_login = (config.FRONTEND_URL.rstrip("/") if config.FRONTEND_URL else "http://localhost:3000") + "/login"
        redirect_url = f"{frontend_login}?code={code}"
        if state:
            redirect_url += f"&state={state}"
        return redirect_url