from functools import lru_cache

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Clevermike Blog API"
    app_env: str = "development"
    api_prefix: str = "/api"
    frontend_origin: AnyHttpUrl | str = "http://localhost:3000"
    site_url: AnyHttpUrl | str = "http://localhost:3000"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    database_url: str
    media_storage: str = "local"
    media_local_dir: str = "uploads"
    media_public_base_url: str = "http://localhost:8000/uploads"
    max_upload_mb: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
