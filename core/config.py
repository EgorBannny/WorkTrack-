from pydantic import BaseModel, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class RunConfig(BaseSettings):
    app: str = "main:main_app"
    host: str = "127.0.0.1"
    port: int = 8000
    reload: bool = True


class APIPrefix(BaseModel):
    prefix: str = "/api"


class DatabasePostgresqlConfig(BaseModel):
    url: PostgresDsn
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10


class DatabaseRedisConfig(BaseModel):
    url: RedisDsn


class DatabaseConfig(BaseModel):
    pg: DatabasePostgresqlConfig
    # redis: DatabaseRedisConfig


class Settings(BaseSettings):
    model_config: SettingsConfigDict = SettingsConfigDict(
        env_file=("env.template", ".env"),
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
    )
    run: RunConfig = RunConfig()
    api: APIPrefix = APIPrefix()
    db: DatabaseConfig


settings = Settings()
