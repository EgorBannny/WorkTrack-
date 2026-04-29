from fastapi import APIRouter
from app.core.config.main_config import settings
from app.api.dependencies.authentication.fastapi_users import fastapi_users
from app.core.authentication import auth_cookie_backend
from app.core.schemas import UserRead, UserCreate

cookie_router = APIRouter(
    prefix=settings.api.prefix.cookie,
    tags=[settings.api.tags.cookie],
)

# /login /logout
cookie_router.include_router(
    router=fastapi_users.get_auth_router(
        backend=auth_cookie_backend,
    ),
)

# /register
cookie_router.include_router(
    router=fastapi_users.get_register_router(
        user_schema=UserRead,
        user_create_schema=UserCreate,
    )
)

# /request-verify-token /verify
cookie_router.include_router(
    router=fastapi_users.get_verify_router(
        user_schema=UserRead,
    )
)

# /forgot-password /reset-password
cookie_router.include_router(router=fastapi_users.get_reset_password_router())
