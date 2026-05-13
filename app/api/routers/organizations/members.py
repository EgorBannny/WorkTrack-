import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.invitations import create_invitation
from app.api.crud.members import (
    get_org_members,
    update_member,
    remove_member,
    get_member,
)
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.members import get_member_or_404
from app.api.dependencies.organizations import (
    get_org_or_404,
    get_current_user_organization,
    require_role,
)
from app.core.models import (
    db_helper,
    redis_helper,
    User,
    Organization,
    UserOrganization,
)
from app.core.schemas import InviteCreate, MemberUpdate, UserOrganizationRead
from app.enums import OrgRole
from app.core.config import settings

log = logging.getLogger(__name__)

members_router = APIRouter(tags=[settings.api.tags.members])


@members_router.get(
    "/{org_id}/members",
    response_model=list[UserOrganizationRead],
    status_code=status.HTTP_200_OK,
)
async def get_members(
    _: Annotated[UserOrganization, Depends(get_current_user_organization)],
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_org_members(session, org.id)


@members_router.post(
    "/{org_id}/invite",
    status_code=status.HTTP_201_CREATED,
)
async def invite_member(
    data: InviteCreate,
    current_user: Annotated[User, auth_guard],
    org: Annotated[Organization, Depends(get_org_or_404)],
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    redis: Annotated[Redis, Depends(redis_helper.client_getter)],
):
    result = await session.execute(select(User).where(User.email == data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        already_member = await get_member(session, org.id, existing_user.id)
        if already_member:
            raise HTTPException(status.HTTP_409_CONFLICT, "User is already a member")

    token = await create_invitation(
        redis,
        org_id=org.id,
        email=data.email,
        role=data.role.value,
        position=data.position,
        invited_by=current_user.id,
    )
    log.info("Invitation token=%s email=%s org=%s", token, data.email, org.id)
    return {"token": token}


@members_router.patch(
    "/{org_id}/members/{user_id}",
    response_model=UserOrganizationRead,
    status_code=status.HTTP_200_OK,
)
async def update_org_member(
    data: MemberUpdate,
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    target: Annotated[UserOrganization, Depends(get_member_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if data.role is not None:
        if target.role == OrgRole.owner:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot change owner's role")
        if data.role == OrgRole.owner:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot assign owner role")

    return await update_member(
        session=session, uo=target, role=data.role, position=data.position
    )


@members_router.delete(
    "/{org_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_org_member(
    current_uo: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    target: Annotated[UserOrganization, Depends(get_member_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if target.role == OrgRole.owner:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot remove owner")
    if target.user_id == current_uo.user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot remove yourself")
    await remove_member(session, target)
