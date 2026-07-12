from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/transitops"
    SUPER_ADMIN_EMAIL: str = "superadmin@workforce.pro"
    SUPER_ADMIN_PASSWORD: str = "superadmin123"

    class Config:
        env_file = ".env"

settings = Settings()
