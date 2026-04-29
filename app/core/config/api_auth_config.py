from pathlib import Path
from typing import Literal
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent.parent.parent.parent

EXPIRE_SECONDS: int = 900


class AuthJWTConfig(BaseModel):
    private_key_path: Path = BASE_DIR / "certs" / "jwt-private.pem"
    public_key_path: Path = BASE_DIR / "certs" / "jwt-public.pem"
    algorithm: str = "RS256"
    access_token_lifetime_seconds: int = EXPIRE_SECONDS
    # Сброс пароля
    reset_password_token_secret: str
    reset_password_token_lifetime_seconds: int = 3600
    reset_password_token_audience: str = "fastapi-users:reset"
    # Подтверждение email
    verification_token_secret: str
    verification_token_lifetime_seconds: int = 3600
    verification_token_audience: str = "fastapi-users:verify"


class AuthCookieConfig(BaseModel):
    name: str = "access_token"
    max_age: int = EXPIRE_SECONDS
    path: str = "/"
    domain: str | None = None  # TODO: Поменять на проде
    secure: bool = False  # TODO: Поменять на проде
    httponly: bool = True
    samesite: Literal["lax", "strict", "none"] = "lax"


class AuthConfig(BaseModel):
    jwt: AuthJWTConfig
    cookie: AuthCookieConfig = AuthCookieConfig()
