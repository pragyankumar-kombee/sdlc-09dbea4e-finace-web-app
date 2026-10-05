# @module: SharedCommon.backend/common/config.py
# @spec_section_id: implementation_blueprint
# @req_ids: N/A
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized configuration management for the FinPulse Engine backend service.
    Loads environment variables and validates types using Pydantic BaseSettings.
    
    CRITICAL: Secrets and credentials (e.g. DATABASE_URL, JWT_SECRET, SECRET_KEY)
    have no hardcoded fallback values and must be provided via the environment
    to satisfy security requirements.
    """

    # Application Configuration
    PROJECT_NAME: str = "FinPulse Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Security & Authentication (No default for secrets per security guidelines)
    SECRET_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Datastore & Caching (No default for DB URL per security guidelines)
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    # External Integrations (No default for API credentials)
    PLAID_CLIENT_ID: str = ""
    PLAID_SECRET: str = ""
    PLAID_ENV: str = "sandbox"

    FINICITY_PARTNERS_ID: str = ""
    FINICITY_APP_KEY: str = ""
    FINICITY_APP_SECRET: str = ""

    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@finpulse.local"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


def get_settings() -> Settings:
    """
    Factory function to instantiate and return cached application settings.
    """
    return Settings()


# Singleton instance of settings to be imported across the application modules
settings = get_settings()