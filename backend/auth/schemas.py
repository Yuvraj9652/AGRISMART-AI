"""
Pydantic schemas for Authentication endpoints & contracts.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr = Field(..., example="evaluator@agrismart.ai")
    password: str = Field(..., min_length=6, example="hackathon2026")
    name: str = Field(..., example="Vikram Sharma")
    role: Optional[str] = Field("Agronomist", example="Agronomist")
    farm_name: Optional[str] = Field("AgriSmart Farm", example="Punjab Organic Farms")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="evaluator@agrismart.ai")
    password: str = Field(..., example="hackathon2026")

class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., example="eyJhbGciOiJSUzI1NiIs...")

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    auth_provider: str
    google_sub: Optional[str] = None
    role: Optional[str] = ""
    farm_name: Optional[str] = ""
    location: Optional[str] = ""
    phone: Optional[str] = ""
    bio: Optional[str] = ""
    total_scans: int = 0
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    total_scans: Optional[int] = None
