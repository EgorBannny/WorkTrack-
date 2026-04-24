from pydantic import BaseModel


class RunConfig(BaseModel):
    app: str = "main:main_app"
    host: str = "127.0.0.1"
    port: int = 8000
    reload: bool = True
