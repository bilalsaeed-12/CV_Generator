"""
Configuration.

Everything environment-specific lives here and comes from .env. Nothing in the
codebase reads os.environ directly — import `settings` instead, so there is one
place to look when something is misconfigured.
"""

from functools import lru_cache
from typing import Type, Tuple

from pydantic import field_validator
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: Type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> Tuple[PydanticBaseSettingsSource, ...]:
        """
        Prioritise real OS environment variables over the .env file.

        Railway injects reference variables (e.g. ${{Postgres.DATABASE_URL}})
        as OS environment variables at container startup — it never writes
        them into .env. Pydantic's default source order puts init kwargs
        first, then .env, then OS env, which means a stale/hardcoded value in
        .env would silently win over Railway's env var. Putting env_settings
        before dotenv_settings here makes OS env vars take precedence, while
        .env still works as a local-dev fallback.
        """
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            file_secret_settings,
        )

    # --- Database ---------------------------------------------------------
    # Must use the +asyncpg driver; plain postgresql:// is the sync driver and
    # will fail at startup with a confusing error.
    DATABASE_URL: str

    # --- Security ---------------------------------------------------------
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 30

    # --- CORS -------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:5173"

    # --- Cookies ----------------------------------------------------------
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    ENVIRONMENT: str = "development"

    @field_validator("DATABASE_URL")
    @classmethod
    def must_be_async_driver(cls, v: str) -> str:
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must start with postgresql+asyncpg:// "
                "(the async driver). Got: " + v.split("://")[0]
            )
        return v

    @property
    def cors_origins(self) -> list[str]:
        """CORS_ORIGINS is a comma-separated string in .env; the middleware wants a list."""
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    """Cached so the .env file is parsed once per process, not per request."""
    return Settings()


settings = get_settings()
