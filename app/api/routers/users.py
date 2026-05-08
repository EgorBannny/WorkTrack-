import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.models import User
from app.core.schemas import UserRead, UserUpdate

from app.api.dependencies.authentication import fastapi_users, auth_guard
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
    "/{user_id}/avatar",
    status_code=status.HTTP_200_OK,
    dependencies=[auth_guard],
)
async def get_avatar(user_id: uuid.UUID):
    user_dir = settings.uploads.avatars_dir / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    files = list(user_dir.glob("avatar.*"))
    if files:
        return FileResponse(files[0])

    return FileResponse(settings.uploads.default_avatar)


@users_router.delete(
    "/me/avatar",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_avatar(current_user: Annotated[User, auth_guard]):
    user_dir = settings.uploads.avatars_dir / str(current_user.id)
    files = list(user_dir.glob("avatar.*"))

    if not files:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Avatar not found")

    for file in files:
        file.unlink()


@users_router.post(
    "/me/avatar",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
async def upload_avatar(
    avatar: Annotated[ValidatedAvatar, Depends(validate_avatar)],
    current_user: Annotated[User, auth_guard],
):
    user_dir = settings.uploads.avatars_dir / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    for old in user_dir.glob("avatar.*"):
        old.unlink()

    (user_dir / f"avatar.{avatar.ext}").write_bytes(avatar.content)

    return current_user
