from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Test connection to PostgreSQL. If it fails, fall back to SQLite automatically for convenience.
try:
    engine = create_engine(settings.DATABASE_URL, connect_args={"connect_timeout": 3})
    conn = engine.connect()
    conn.close()
    print("Successfully connected to PostgreSQL database.")
except Exception as e:
    print("\n" + "!"*60)
    print("WARNING: Could not connect to PostgreSQL database.")
    print(f"Error detail: {e}")
    print("Falling back to local SQLite database: sqlite:///./transitops.db")
    print("!"*60 + "\n")
    engine = create_engine("sqlite:///./transitops.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
