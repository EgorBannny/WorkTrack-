from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer

from app.api.dependencies.authentication.fastapi_users import fastapi_users
from app.api.routers.auth.logout import make_bearer_logout_router
from app.api.routers.auth.refresh import make_bearer_refresh_router
from app.core.authentication import auth_bearer_backend
from app.core.config.main_config import settings
from app.core.schemas import UserRead, UserCreate

http_bearer: HTTPBearer = HTTPBearer(auto_error=False)

bearer_router = APIRouter(
    prefix=settings.api.prefix.bearer,
    tags=[settings.api.tags.bearer],
    dependencies=[Depends(http_bearer)],
)

# /logout — кастомный
bearer_router.include_router(make_bearer_logout_router())


# /login /logout — FU-шный logout
bearer_router.include_router(
    router=fastapi_users.get_auth_router(
        backend=auth_bearer_backend,
        requires_verification=settings.auth.requires_verification,
    ),
)

# /refresh — кастомный
bearer_router.include_router(make_bearer_refresh_router())

# /register
bearer_router.include_router(
    router=fastapi_users.get_register_router(
        user_schema=UserRead,
        user_create_schema=UserCreate,
    )
)

# /request-verify-token /verify
bearer_router.include_router(
    router=fastapi_users.get_verify_router(
        user_schema=UserRead,
    )
)

# /forgot-password /reset-password
bearer_router.include_router(router=fastapi_users.get_reset_password_router())
