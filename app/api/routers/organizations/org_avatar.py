from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import (
    get_current_user_organization,
    require_role,
)
from app.api.dependencies.uploads import ValidatedAvatar, validate_avatar
from app.core.config import settings
from app.core.models import UserOrganization
from app.enums import OrgRole

org_avatar_router = APIRouter(tags=[settings.api.tags.avatar])


@org_avatar_router.get(
    "/{org_id}/avatar",
    status_code=status.HTTP_200_OK,
    dependencies=[auth_guard],
)
async def get_org_avatar(
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
):
    org_dir = settings.uploads.org_avatars_dir / str(uo.org_id)
    org_dir.mkdir(parents=True, exist_ok=True)
    files = list(org_dir.glob("avatar.*"))
    if not files:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization has no avatar")
    return FileResponse(files[0])


@org_avatar_router.post(
    "/{org_id}/avatar",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def upload_org_avatar(
    _: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    avatar: Annotated[ValidatedAvatar, Depends(validate_avatar)],
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
):
    org_dir = settings.uploads.org_avatars_dir / str(uo.org_id)
    org_dir.mkdir(parents=True, exist_ok=True)
    for old in org_dir.glob("avatar.*"):
        old.unlink()
    (org_dir / f"avatar.{avatar.ext}").write_bytes(avatar.content)


@org_avatar_router.delete(
    "/{org_id}/avatar",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_org_avatar(
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    _: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
):
    org_dir = settings.uploads.org_avatars_dir / str(uo.org_id)
    files = list(org_dir.glob("avatar.*"))
    if not files:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization has no avatar")
    for file in files:
        file.unlink()
