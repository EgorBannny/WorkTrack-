from fastapi import APIRouter
from app.core.config.main_config import settings
from .fastapi_users import fastapi_users
from app.core.authentication import auth_bearer_backend, auth_cookie_backend

auth_router = APIRouter(
    prefix=settings.api.v1.prefix.auth,
    tags=[settings.api.v1.tags.auth],
)

auth_router.include_router(
    router=fastapi_users.get_auth_router(auth_cookie_backend),
    prefix=settings.api.v1.prefix.cookie,
    tags=[settings.api.v1.tags.cookie],
)
auth_router.include_router(
    router=fastapi_users.get_auth_router(auth_bearer_backend),
    prefix=settings.api.v1.prefix.bearer,
    tags=[settings.api.v1.tags.bearer],
)
