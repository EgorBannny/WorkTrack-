from fastapi import APIRouter
from app.core.config.main_config import settings
from app.api.dependencies.authentication.fastapi_users import fastapi_users
from app.core.authentication import auth_cookie_backend
from app.core.schemas import UserRead, UserUpdate

users_router = APIRouter(
    prefix=settings.api.v1.prefix.users,
    tags=[settings.api.v1.tags.users],
)

users_router.include_router(
    router=fastapi_users.get_users_router(
        user_schema=UserRead,
        user_update_schema=UserUpdate,
    ),
)
