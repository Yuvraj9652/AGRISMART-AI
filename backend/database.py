"""
Database connection and session management using SQLAlchemy & SQLite.
Automatically initializes tables on server startup without external DB setup.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import DATABASE_URL

# Connect args for SQLite to support multi-threaded FastAPI access
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency supplying database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Creates database tables automatically if they do not exist and migrates columns."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN total_scans INTEGER DEFAULT 0;"))
            conn.commit()
    except Exception:
        pass

    # Clean up old demo strings from accounts that signed up via Google or non-demo
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                UPDATE users
                SET 
                    location = CASE WHEN location = 'Greenhouse 4B, Sector 7' THEN '' ELSE location END,
                    phone = CASE WHEN phone = '+91 98765 43210' THEN '' ELSE phone END,
                    bio = CASE WHEN bio = 'Agricultural AI evaluator testing computer vision foliar diagnostics.' THEN '' ELSE bio END
                WHERE auth_provider IN ('google', 'google_local') OR email != 'evaluator@agrismart.ai';
            """))
            conn.execute(text("""
                UPDATE users
                SET 
                    role = '',
                    farm_name = ''
                WHERE (auth_provider IN ('google', 'google_local'))
                  AND (role IN ('Agronomist', 'Demo Sandbox Mode') OR farm_name IN ('AgriSmart Farm', 'AgriSmart Experimental Farm'));
            """))
            conn.commit()
    except Exception:
        pass
