from fastapi import APIRouter, Depends
from fastapi.security import APIKeyCookie

from app.api.dependencies.authentication.fastapi_users import fastapi_users
from app.api.routers.auth.logout import (
    make_cookie_logout_router,
    make_cookie_logout_all_router,
)
from app.api.routers.auth.refresh import make_cookie_refresh_router
from app.core.authentication import auth_cookie_backend
from app.core.config.main_config import settings
from app.core.schemas import UserRead, UserCreate

api_key_cookie = APIKeyCookie(
    name=settings.auth.cookie.access_name,
    auto_error=False,
)

cookie_router = APIRouter(
    prefix=settings.api.prefix.cookie,
    tags=[settings.api.tags.cookie],
    dependencies=[Depends(api_key_cookie)],
)

# /logout — кастомный
cookie_router.include_router(make_cookie_logout_router())

# /login /logout — FU-шный logout
cookie_router.include_router(
    router=fastapi_users.get_auth_router(
        backend=auth_cookie_backend,
        requires_verification=settings.auth.requires_verification,
    ),
)

# /logout-all — кастомный
cookie_router.include_router(make_cookie_logout_all_router())

# /refresh — кастомный
cookie_router.include_router(make_cookie_refresh_router())

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
