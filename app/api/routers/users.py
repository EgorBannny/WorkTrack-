import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

from app.core.config import settings
from app.core.models import User
from app.core.schemas import UserRead, UserUpdate

from app.api.dependencies.authentication import fastapi_users, auth_guard
from app.api.dependencies.users import get_users_db
from app.api.dependencies.uploads import ValidatedAvatar, validate_avatar

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


@users_router.get(
    "/{user_id}/avatar", status_code=status.HTTP_200_OK, dependencies=auth_guard
)
async def get_avatar(
    user_id: uuid.UUID,
    users_db: Annotated[SQLAlchemyUserDatabase, Depends(get_users_db)],
):
    user = await users_db.get(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if user.has_avatar:
        avatar_path = settings.uploads.avatars_dir / f"{user_id}.png"
        if avatar_path.exists():
            return FileResponse(avatar_path)

    return FileResponse(settings.uploads.default_avatar)


@users_router.delete(
    "/me/avatar", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_avatar(
    current_user: Annotated[User, auth_guard],
    users_db: Annotated[SQLAlchemyUserDatabase, Depends(get_users_db)],
):
    if not current_user.has_avatar:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Avatar not found")

    await users_db.update(current_user, {"has_avatar": False})

    avatar_path = settings.uploads.avatars_dir / f"{current_user.id}.png"
    if avatar_path.exists():
        avatar_path.unlink()


@users_router.post(
    "/me/avatar", response_model=UserRead, status_code=status.HTTP_200_OK
)
async def upload_avatar(
    avatar: Annotated[ValidatedAvatar, Depends(validate_avatar)],
    current_user: Annotated[User, auth_guard],
    users_db: Annotated[SQLAlchemyUserDatabase, Depends(get_users_db)],
):
    avatar_dir = settings.uploads.avatars_dir
    avatar_dir.mkdir(parents=True, exist_ok=True)
    avatar_path = avatar_dir / f"{current_user.id}.png"
    avatar_path.write_bytes(avatar.content)

    if not current_user.has_avatar:
        return await users_db.update(current_user, {"has_avatar": True})

    return current_user
