"""
REST API Router for Authentication (POST /api/auth/register, /login, /google, /logout, GET /me).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.schemas import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    TokenResponse,
    UserResponse,
    UpdateProfileRequest
)
from backend.auth.service import (
    get_user_by_email,
    create_local_user,
    authenticate_local_user,
    authenticate_or_create_google_user
)
from backend.auth.security import create_access_token, verify_google_id_token
from backend.auth.dependencies import get_current_user
from backend.auth.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user with email, name, role, and password.
    Returns signed JWT access token and user metadata.
    """
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = create_local_user(db, user_in)
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "name": user.name})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates email and password credentials.
    Returns signed JWT access token.
    """
    user = authenticate_local_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "name": user.name})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/google", response_model=TokenResponse)
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Verifies Google ID Token server-side via Google Identity Services.
    Retrieves or creates user by stable Google 'sub' identifier and issues FastAPI JWT.
    """
    try:
        google_info = verify_google_id_token(request.id_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )

    user = authenticate_or_create_google_user(db, google_info)
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "name": user.name})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves currently authenticated user derived from verified Bearer JWT token.
    """
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates profile details for the authenticated user.
    """
    if profile_data.name is not None:
        current_user.name = profile_data.name.strip()
    if profile_data.role is not None:
        current_user.role = profile_data.role.strip()
    if profile_data.farm_name is not None:
        current_user.farm_name = profile_data.farm_name.strip()
    if profile_data.location is not None:
        current_user.location = profile_data.location.strip()
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip()
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio.strip()
    if profile_data.total_scans is not None:
        current_user.total_scans = max(current_user.total_scans or 0, profile_data.total_scans)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/increment-scans", response_model=UserResponse)
def increment_scans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Increments total_scans count for the authenticated user and persists to database.
    """
    current_user.total_scans = (current_user.total_scans or 0) + 1
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Client session logout endpoint.
    Client side should clear stored JWT token.
    """
    return {"status": "success", "message": f"Successfully logged out user '{current_user.email}'."}
