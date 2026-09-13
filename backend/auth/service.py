"""
Service layer for database user queries, authentication, registration, and Google OAuth user syncing.
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.auth.models import User
from backend.auth.schemas import UserRegister
from backend.auth.security import hash_password, verify_password

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()

def get_user_by_google_sub(db: Session, google_sub: str) -> Optional[User]:
    return db.query(User).filter(User.google_sub == google_sub).first()

def create_local_user(db: Session, user_in: UserRegister) -> User:
    """Registers a new user with password hashing."""
    hashed_pwd = hash_password(user_in.password)
    user = User(
        email=user_in.email.lower().strip(),
        name=user_in.name.strip(),
        password_hash=hashed_pwd,
        auth_provider="local",
        role=user_in.role or "",
        farm_name=user_in.farm_name or "",
        location="",
        phone="",
        bio="",
        total_scans=0,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_local_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticates email + password user."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not user.password_hash:
        # User registered exclusively via Google sign-in without local password
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def authenticate_or_create_google_user(db: Session, google_info: Dict[str, Any]) -> User:
    """
    Verifies Google user by 'sub' identifier.
    If user exists by google_sub, returns user.
    If user exists by email, links google_sub and returns user.
    Otherwise creates new user with google_sub.
    """
    g_sub = google_info["sub"]
    g_email = google_info.get("email", "").lower().strip()
    g_name = google_info.get("name", g_email.split("@")[0] if g_email else "Google User")

    # 1. Look up by stable Google `sub` ID
    user = get_user_by_google_sub(db, g_sub)
    if user:
        return user

    # 2. Look up by email if google_sub wasn't linked yet
    if g_email:
        user = get_user_by_email(db, g_email)
        if user:
            user.google_sub = g_sub
            if user.auth_provider == "local":
                user.auth_provider = "google_local"
            db.commit()
            db.refresh(user)
            return user

    # 3. Create new user with Google identity
    user = User(
        email=g_email,
        name=g_name,
        google_sub=g_sub,
        password_hash=None,
        auth_provider="google",
        role="",
        farm_name="",
        location="",
        phone="",
        bio="",
        total_scans=0,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
