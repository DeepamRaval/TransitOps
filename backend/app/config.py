from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/transitops"
    JWT_SECRET_KEY: str = "transitops-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "deepamraval7@gmail.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "deepamraval7@gmail.com"

    OTP_EXPIRE_MINUTES: int = 10
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCK_MINUTES: int = 30

    SEED_DEMO_PASSWORD: str = "TransitOps@123"

    class Config:
        env_file = (".env", "../.env", "backend/.env")
        extra = "ignore"

settings = Settings()
