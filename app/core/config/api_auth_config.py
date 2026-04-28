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
    reset_password_token_secret: str
    verification_token_secret: str


class AuthCookieConfig(BaseModel):
    cookie_name: str = "access_token"
    cookie_max_age: int = EXPIRE_SECONDS
    cookie_path: str = "/"
    cookie_domain: str | None = None  # TODO: Поменять на проде
    cookie_secure: bool = False  # TODO: Поменять на проде
    cookie_httponly: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"


class AuthConfig(BaseModel):
    jwt: AuthJWTConfig
    cookie: AuthCookieConfig = AuthCookieConfig()
