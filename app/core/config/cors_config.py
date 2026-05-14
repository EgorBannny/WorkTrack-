from pydantic import BaseModel


class CORSConfig(BaseModel):
    allowed_origins: list[str]
    allow_credentials: bool
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]
