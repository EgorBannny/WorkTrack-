from pydantic_settings import BaseSettings, SettingsConfigDict
from .run_config import RunConfig
from .api_config import APIConfig
from .database_config import DatabaseConfig
from .api_auth_config import AuthJWTConfig


class Settings(BaseSettings):
    model_config: SettingsConfigDict = SettingsConfigDict(
        env_file=("env.template", ".env"),
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
    )
    run: RunConfig = RunConfig()
    api: APIConfig = APIConfig()
    db: DatabaseConfig
    auth_jwt: AuthJWTConfig = AuthJWTConfig()


settings = Settings()
