from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# Database configuration
# Default to SQLite for easier local development if PostgreSQL is not available
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")

# SQLite specific arguments
connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": False
}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20
    })

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
