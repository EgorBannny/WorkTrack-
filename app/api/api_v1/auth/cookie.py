from fastapi import APIRouter
from app.core.config.main_config import settings
from .fastapi_users import fastapi_users
from app.core.authentication import auth_cookie_backend

cookie_router = APIRouter(
    prefix=settings.api.v1.prefix.cookie,
    tags=[settings.api.v1.tags.cookie],
)

cookie_router.include_router(
    router=fastapi_users.get_auth_router(auth_cookie_backend),
)
