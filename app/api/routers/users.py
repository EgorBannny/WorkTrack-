from fastapi import APIRouter
from app.core.config.main_config import settings
from app.api.dependencies.authentication.fastapi_users import fastapi_users
from app.core.schemas import UserRead, UserUpdate

users_router = APIRouter(
    prefix=settings.api.prefix.users,
    tags=[settings.api.tags.users],
)

users_router.include_router(
    router=fastapi_users.get_users_router(
        user_schema=UserRead,
        user_update_schema=UserUpdate,
    ),
)
