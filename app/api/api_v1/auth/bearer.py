from fastapi import APIRouter
from app.core.config.main_config import settings
from .fastapi_users import fastapi_users
from app.core.authentication import auth_bearer_backend
from app.core.schemas import UserRead, UserCreate, UserUpdate

bearer_router = APIRouter(
    prefix=settings.api.v1.prefix.bearer,
    tags=[settings.api.v1.tags.bearer],
)

# /login /logout
bearer_router.include_router(
    router=fastapi_users.get_auth_router(
        backend=auth_bearer_backend,
    ),
)

# /register
bearer_router.include_router(
    router=fastapi_users.get_register_router(
        user_schema=UserRead,
        user_create_schema=UserCreate,
    )
)
