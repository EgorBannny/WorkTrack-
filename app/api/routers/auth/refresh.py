from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from app.api.dependencies.authentication.user_manager import get_user_manager
from app.core.authentication import (
    RefreshTokenService,
    get_refresh_token_service,
    UserManager,
)
from app.core.authentication.strategy import WorkTrackJWTStrategy, get_jwt_strategy
from app.core.config import settings


class BearerRefreshSchema(BaseModel):
    access_token: str
    refresh_token: str


async def _get_user_and_rotate(
    old_access_token: str,
    old_refresh_token: str,
    refresh_service: RefreshTokenService,
    strategy: WorkTrackJWTStrategy,
    user_manager: UserManager,
) -> tuple[str, str]:
    payload = await refresh_service.read_token(old_refresh_token)
    if payload is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token"
        )

    try:
        user = await user_manager.get(user_manager.parse_id(payload["sub"]))
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    if not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User is inactive")

    new_refresh = await refresh_service.rotate(old_refresh_token, user)
    new_access = await strategy.rotate(old_access_token, user)

    await refresh_service.redis.set(f"user_version:{user.id}", user.token_version)

    return new_access, new_refresh


def make_cookie_refresh_router() -> APIRouter:
    router = APIRouter()

    @router.post("/refresh", status_code=status.HTTP_204_NO_CONTENT)
    async def cookie_refresh(
        request: Request,
        response: Response,
        refresh_service: Annotated[
            RefreshTokenService, Depends(get_refresh_token_service)
        ],
        strategy: Annotated[WorkTrackJWTStrategy, Depends(get_jwt_strategy)],
        user_manager: Annotated[UserManager, Depends(get_user_manager)],
    ):
        old_access_token = request.cookies.get(settings.auth.cookie.access_name)
        old_refresh_token = request.cookies.get(settings.auth.cookie.refresh_name)

        new_access, new_refresh = await _get_user_and_rotate(
            old_access_token=old_access_token,
            old_refresh_token=old_refresh_token,
            refresh_service=refresh_service,
            strategy=strategy,
            user_manager=user_manager,
        )

        response.set_cookie(
            key=settings.auth.cookie.access_name,
            value=new_access,
            max_age=settings.auth.jwt.access_token_lifetime_seconds,
            path=settings.auth.cookie.path,
            domain=settings.auth.cookie.domain,
            secure=settings.auth.cookie.secure,
            httponly=settings.auth.cookie.httponly,
            samesite=settings.auth.cookie.samesite,
        )
        response.set_cookie(
            key=settings.auth.cookie.refresh_name,
            value=new_refresh,
            max_age=settings.auth.jwt.refresh_token_lifetime_seconds,
            path=settings.auth.cookie.refresh_path,
            domain=settings.auth.cookie.domain,
            secure=settings.auth.cookie.secure,
            httponly=settings.auth.cookie.httponly,
            samesite=settings.auth.cookie.samesite,
        )

    return router


def make_bearer_refresh_router() -> APIRouter:
    router = APIRouter()

    @router.post("/refresh", status_code=status.HTTP_200_OK)
    async def bearer_refresh(
        body: BearerRefreshSchema,
        refresh_service: Annotated[
            RefreshTokenService, Depends(get_refresh_token_service)
        ],
        strategy: Annotated[WorkTrackJWTStrategy, Depends(get_jwt_strategy)],
        user_manager: Annotated[UserManager, Depends(get_user_manager)],
    ):
        new_access, new_refresh = await _get_user_and_rotate(
            old_access_token=body.access_token,
            old_refresh_token=body.refresh_token,
            refresh_service=refresh_service,
            strategy=strategy,
            user_manager=user_manager,
        )

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
        }

    return router
