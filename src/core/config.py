from pydantic import BaseModel
from pydantic_settings import BaseSettings


class RunConfig(BaseSettings):
    app: str = "main:app"
    host: str = "127.0.0.1"
    port: int = 8000
    reload: bool = True


class APIPrefix(BaseModel):
    prefix: str = "/api"


class Settings(BaseSettings):
    run: RunConfig = RunConfig()
    api: APIPrefix = APIPrefix()


settings = Settings()
