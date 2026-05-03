from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel

from app.api.dependencies.authentication.fastapi_users import fastapi_users
from app.core.authentication import RefreshTokenService, get_refresh_token_service
from app.core.authentication.strategy import WorkTrackJWTStrategy, get_jwt_strategy
from app.core.config import settings
from app.core.models import User


class BearerLogoutSchema(BaseModel):
    refresh_token: str | None = None


def make_cookie_logout_router() -> APIRouter:
    router = APIRouter()

    @router.post("/logout", status_code=204)
    async def cookie_logout(
        request: Request,
        response: Response,
        user_token: Annotated[
            tuple[User, str],
            Depends(fastapi_users.authenticator.current_user_token(active=True)),
        ],
        strategy: Annotated[WorkTrackJWTStrategy, Depends(get_jwt_strategy)],
        refresh_service: Annotated[
            RefreshTokenService, Depends(get_refresh_token_service)
        ],
    ):
        user, access_token = user_token
        await strategy.destroy_token(access_token, user)

        refresh_token = request.cookies.get(settings.auth.cookie.refresh_name)
        if refresh_token:
            await refresh_service.destroy_token(refresh_token)

        response.delete_cookie(
            key=settings.auth.cookie.access_name,
            path=settings.auth.cookie.path,
        )
        response.delete_cookie(
            key=settings.auth.cookie.refresh_name,
            path=settings.auth.cookie.path,
        )

    return router


def make_bearer_logout_router() -> APIRouter:
    router = APIRouter()

    @router.post("/logout", status_code=204)
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
        user, access_token = user_token
        await strategy.destroy_token(access_token, user)

        if body.refresh_token:
            await refresh_service.destroy_token(body.refresh_token)

    return router
