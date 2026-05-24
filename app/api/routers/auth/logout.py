from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel

from app.api.dependencies.authentication import fastapi_users, auth_guard
from app.api.dependencies.authentication.user_manager import get_user_manager
from app.core.authentication import (
    RefreshTokenService,
    get_refresh_token_service,
    UserManager,
)
from app.core.authentication.strategy import WorkTrackJWTStrategy, get_jwt_strategy
from app.core.config import settings
from app.core.models import User


class BearerLogoutSchema(BaseModel):
    refresh_token: str


def make_cookie_logout_router() -> APIRouter:
    router = APIRouter()

    @router.post(
        "/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[auth_guard]
    )
    async def cookie_logout(
        request: Request,
        response: Response,
        strategy: Annotated[WorkTrackJWTStrategy, Depends(get_jwt_strategy)],
        refresh_service: Annotated[
            RefreshTokenService, Depends(get_refresh_token_service)
        ],
    ):
        access_token = request.cookies.get(settings.auth.cookie.access_name)
        refresh_token = request.cookies.get(settings.auth.cookie.refresh_name)

        if access_token:
            await strategy.destroy_token(access_token)
        if refresh_token:
            await refresh_service.destroy_token(refresh_token)

        response.delete_cookie(
            key=settings.auth.cookie.access_name,
            path=settings.auth.cookie.path,
        )
        response.delete_cookie(
            key=settings.auth.cookie.refresh_name,
            path=settings.auth.cookie.refresh_path,
        )

    return router


def make_bearer_logout_router() -> APIRouter:
    router = APIRouter()

    @router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
    async def bearer_logout(
        body: BearerLogoutSchema,
        user_token: Annotated[
            tuple[User, str],
            Depends(fastapi_users.authenticator.current_user_token(active=True)),
        ],
        strategy: Annotated[WorkTrackJWTStrategy, Depends(get_jwt_strategy)],
        refresh_service: Annotated[
            RefreshTokenService, Depends(get_refresh_token_service)
        ],
    ):

        access_token: str = user_token[1]
        await strategy.destroy_token(access_token)
        await refresh_service.destroy_token(body.refresh_token)

    return router


def make_cookie_logout_all_router() -> APIRouter:
    router = APIRouter()

    @router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
    async def cookie_logout_all(
        response: Response,
        user: Annotated[
            User,
            auth_guard,
        ],
        user_manager: Annotated[UserManager, Depends(get_user_manager)],
    ):
        await user_manager.increment_token_version(user)

        response.delete_cookie(
            key=settings.auth.cookie.access_name,
            path=settings.auth.cookie.path,
        )
        response.delete_cookie(
            key=settings.auth.cookie.refresh_name,
            path=settings.auth.cookie.refresh_path,
        )

    return router


def make_bearer_logout_all_router() -> APIRouter:
    router = APIRouter()

    @router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
    async def bearer_logout_all(
        user: Annotated[
            User,
            auth_guard,
        ],
        user_manager: Annotated[UserManager, Depends(get_user_manager)],
    ):
        await user_manager.increment_token_version(user)

    return router
