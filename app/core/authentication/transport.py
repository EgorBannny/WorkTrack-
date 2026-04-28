from fastapi_users.authentication import CookieTransport, BearerTransport
from app.core.config.main_config import settings

cookie_transport = CookieTransport(
    cookie_name=settings.auth.cookie.cookie_name,
    cookie_max_age=settings.auth.cookie.cookie_max_age,
    cookie_path=settings.auth.cookie.cookie_path,
    cookie_domain=settings.auth.cookie.cookie_domain,
    cookie_secure=settings.auth.cookie.cookie_secure,
    cookie_httponly=settings.auth.cookie.cookie_httponly,
    cookie_samesite=settings.auth.cookie.cookie_samesite,
)

bearer_transport = BearerTransport(
    tokenUrl="auth/jwt/login"
)  # TODO: Сделать нормальный путь, когда будут готовы ручки
