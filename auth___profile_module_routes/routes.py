# @module: Auth & Profile Module.routes
# @spec_section_id: Section 3
# @req_ids: AUTH-01, AUTH-02, AUTH-03, AUTH-04, NFR-05, AC-01, AUTH-200, AUTH-201, AUTH-401, AUTH-423
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from services.auth___profile_module.schemas import (
    UserRegistrationRequest,
    UserLoginRequest,
    PasswordResetRequestRequest,
    PasswordResetConfirmRequest,
    ProfileUpdateRequest,
    TokenResponse,
    UserResponse
)
from services.auth___profile_module.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Auth & Profile"])


def get_auth_service(db: Session = Depends()) -> AuthService:
    """Dependency provider for the AuthService business logic layer."""
    return AuthService(db)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Implements AUTH-01: Registers a new user with valid email, password, and profile details."
)
def register_user(
    payload: UserRegistrationRequest,
    service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Handles user registration.
    Requirement: AUTH-01, AUTH-201
    """
    try:
        user = service.register_user(payload)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user",
    description="Implements AUTH-02: Authenticates registered users via email and password credentials, returning JWT and setting HTTP-only refresh token."
)
def login_user(
    payload: UserLoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service)
) -> TokenResponse:
    """
    Handles user authentication.
    Requirement: AUTH-02, AUTH-200, AUTH-401
    """
    try:
        token_data, refresh_token = service.authenticate_user(payload)
        
        # Set secure HTTP-only refresh token cookie (SameSite=Strict, 7-day expiry as per spec)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=7 * 24 * 60 * 60
        )
        
        return token_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=str(e)
        )


@router.post(
    "/password-reset/request",
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Implements AUTH-03: Initiates password reset mechanism via secure token sent to registered email."
)
def request_password_reset(
    payload: PasswordResetRequestRequest,
    service: AuthService = Depends(get_auth_service)
) -> Dict[str, str]:
    """
    Triggers password reset flow.
    Requirement: AUTH-03
    """
    service.request_password_reset(payload.email)
    return {"message": "If the email exists, a password reset link has been sent."}


@router.post(
    "/password-reset/confirm",
    status_code=status.HTTP_200_OK,
    summary="Confirm password reset",
    description="Implements AUTH-03: Finalizes password reset using the secure reset token and new password."
)
def confirm_password_reset(
    payload: PasswordResetConfirmRequest,
    service: AuthService = Depends(get_auth_service)
) -> Dict[str, str]:
    """
    Completes password reset flow.
    Requirement: AUTH-03
    """
    try:
        service.confirm_password_reset(payload.token, payload.new_password)
        return {"message": "Password successfully reset."}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/profile",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Implements NFR-05 & AC-01: Retrieves authenticated user profile attributes securely."
)
def get_profile(
    current_user: Any = Depends(AuthService.get_current_active_user),
    service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Retrieves current user profile details.
    Requirement: AUTH-04, NFR-05, AC-01, AUTH-401
    """
    return service.get_user_profile(current_user.id)


@router.put(
    "/profile",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile",
    description="Implements AUTH-04: Allows authorized users to update profile attributes including display name and currency preferences."
)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: Any = Depends(AuthService.get_current_active_user),
    service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Updates profile attributes.
    Requirement: AUTH-04, AUTH-401
    """
    try:
        updated_user = service.update_user_profile(current_user.id, payload)
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )