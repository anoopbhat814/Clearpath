from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ANALYTICS_", env_file=".env", extra="ignore")

    max_history_days: int = 120
    max_horizon_days: int = 28
    high_risk_threshold: float = 0.66
    moderate_risk_threshold: float = 0.33


@lru_cache
def get_settings() -> Settings:
    return Settings()
