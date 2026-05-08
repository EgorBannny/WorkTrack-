from fastapi import APIRouter

from app.core.config import settings
from app.core.schemas import UserRead, UserUpdate
from app.api.dependencies.authentication import fastapi_users

from .avatars import avatars_router

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

users_router.include_router(
    router=avatars_router,
)
