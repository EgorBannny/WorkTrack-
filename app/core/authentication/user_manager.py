import logging
from typing import Optional, TYPE_CHECKING
from fastapi_users import BaseUserManager, IntegerIDMixin

from app.core.config.main_config import settings
from app.core.types.user_id import UserIdType
from app.core.models import User

if TYPE_CHECKING:
    from fastapi import Request

log = logging.getLogger(__name__)


class UserManager(IntegerIDMixin, BaseUserManager[User, UserIdType]):
    # Сброс пароля
    reset_password_token_secret: str = settings.auth.jwt.reset_password_token_secret
    reset_password_token_lifetime_seconds: int = (
        settings.auth.jwt.reset_password_token_lifetime_seconds
    )
    reset_password_token_audience: str = settings.auth.jwt.reset_password_token_audience
    # Подтверждение email
    verification_token_secret: str = settings.auth.jwt.verification_token_secret
    verification_token_lifetime_seconds: int = (
        settings.auth.jwt.verification_token_lifetime_seconds
    )
    verification_token_audience: str = settings.auth.jwt.verification_token_audience

    async def on_after_register(
        self,
        user: User,
        request: Optional["Request"] = None,
    ):
        log.warning(
            "User %r has registered.",
            user.id,
        )

    # async def on_after_forgot_password(
    #     self,
    #     user: User,
    #     token: str,
    #     request: Optional["Request"] = None,
    # ):
    #     log.warning(
    #         "User %r has forgot their password. Reset token: %r",
    #         user.id,
    #         token,
    #     )

    # async def on_after_request_verify(
    #     self,
    #     user: User,
    #     token: str,
    #     request: Optional["Request"] = None,
    # ):
    #     log.warning(
    #         "Verification requested for user %r. Verification token: %r",
    #         user.id,
    #         token,
    #     )
