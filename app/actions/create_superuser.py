import asyncio
import contextlib
from os import getenv
from app.api.dependencies.authentication import get_users_db, get_user_manager
from pydantic import EmailStr
from app.core.models import db_helper, User
from app.core.schemas import UserCreate
from app.core.authentication import UserManager


get_users_db_context = contextlib.asynccontextmanager(get_users_db)
get_users_manager_context = contextlib.asynccontextmanager(get_user_manager)

default_email = getenv("DEFAULT_EMAIL", "admin@admin.com")
default_password = getenv("DEFAULT_PASSWORD", "admin")
default__is_active = True
default__is_superuser = True
default__is_verified = True
default__token_version = 1


async def create_user(
    user_manager: UserManager,
    user_create: UserCreate,
) -> User:
    user = await user_manager.create(
        user_create=user_create,
        safe=False,
    )
    return user


async def create_superuser(
    email: EmailStr = default_email,
    password: str = default_password,
    is_active: bool = default__is_active,
    is_superuser: bool = default__is_superuser,
    is_verified: bool = default__is_verified,
    token_version: int = default__token_version,
):
    user_create = UserCreate(
        email=email,
        password=password,
        is_active=is_active,
        is_superuser=is_superuser,
        is_verified=is_verified,
        token_version=token_version,
    )
    async with db_helper.session_factory() as session:
        async with get_users_db_context(session=session) as users_db:
            async with get_users_manager_context(users_db=users_db) as user_manager:
                return await create_user(
                    user_manager=user_manager,
                    user_create=user_create,
                )


if __name__ == "__main__":
    asyncio.run(create_superuser())
