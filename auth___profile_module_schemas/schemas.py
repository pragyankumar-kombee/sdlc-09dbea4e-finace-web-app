# @module: Auth & Profile Module.schemas
# @spec_section_id: Section 3
# @req_ids: AUTH-01, AUTH-02, AUTH-03, AUTH-04, NFR-05, AC-01, AUTH-200, AUTH-201, AUTH-401, AUTH-423
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

"""
Auth & Profile Module Pydantic Schemas.
Implements request and response validation models for authentication, registration,
password resets, and profile management for the FinPulse Engine platform.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user attributes shared across schemas."""
    email: EmailStr = Field(..., description="Registered email address of the user")
    display_name: str = Field(..., min_length=1, max_length=100, description="User's display name")
    currency_preference: str = Field(..., min_length=3, max_length=3, description="ISO 4217 currency code e.g. USD, EUR")


class UserRegisterRequest(UserBase):
    """Schema for user registration (AUTH-01)."""
    password: str = Field(..., min_length=12, max_length=128, description="Secure plaintext password meeting complexity rules")

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        """Enforces password complexity requirements (NFR-05 / AC-01)."""
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one numeric digit.")
        if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in value):
            raise ValueError("Password must contain at least one special character.")
        return value


class UserLoginRequest(BaseModel):
    """Schema for user authentication credentials (AUTH-02)."""
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class PasswordResetRequest(BaseModel):
    """Schema for initiating a password reset (AUTH-03)."""
    email: EmailStr = Field(..., description="Email address to send the password reset token")


class PasswordResetConfirmRequest(BaseModel):
    """Schema for confirming and setting a new password via reset token (AUTH-03)."""
    token: str = Field(..., description="Secure cryptographic reset token received via email")
    new_password: str = Field(..., min_length=12, max_length=128, description="New secure plaintext password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password_complexity(cls, value: str) -> str:
        """Enforces password complexity on reset confirmation."""
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one numeric digit.")
        if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in value):
            raise ValueError("Password must contain at least one special character.")
        return value


class ProfileUpdateRequest(BaseModel):
    """Schema for updating authorized user profile attributes (AUTH-04)."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated display name")
    currency_preference: Optional[str] = Field(None, min_length=3, max_length=3, description="Updated ISO 4217 currency code")


class UserResponse(UserBase):
    """Schema representing user profile details in responses (AUTH-200, AUTH-201)."""
    id: str = Field(..., description="Unique user identifier (UUID)")
    is_active: bool = Field(..., description="Account active status")
    is_verified: bool = Field(..., description="Email verification status")
    created_at: datetime = Field(..., description="Timestamp of user registration")
    updated_at: Optional[datetime] = Field(None, description="Timestamp of last profile update")

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for successful authentication token returns (AUTH-200, AUTH-201)."""
    access_token: str = Field(..., description="JWT short-lived access token")
    refresh_token: Optional[str] = Field(None, description="Opaque HTTP-only refresh token string if returned in body")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(900, description="Access token expiration time in seconds (15 minutes)")


class ErrorDetail(BaseModel):
    """Standardized error detail schema."""
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    target: Optional[str] = Field(None, description="Field or parameter causing the error")


class ErrorResponse(BaseModel):
    """Standardized error response wrapper conforming to AUTH-401 and AUTH-423."""
    status_code: int = Field(..., description="HTTP status code")
    error: ErrorDetail = Field(..., description="Error detail payload")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of error occurrence")