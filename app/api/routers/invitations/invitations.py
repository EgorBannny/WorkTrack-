import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.invitations import get_invitation, delete_invitation
from app.api.crud.members import create_membership, get_member
from app.api.crud.organizations import get_org_by_id
from app.api.dependencies.authentication import auth_guard
from app.core.config import settings
from app.core.models import db_helper, redis_helper, User
from app.core.schemas import InviteRead
from app.enums import OrgRole

invitations_router = APIRouter(
    prefix=settings.api.prefix.invitations,
    tags=[settings.api.tags.invitations],
)


@invitations_router.get(
    "/{token}",
    response_model=InviteRead,
    status_code=status.HTTP_200_OK,
)
async def check_invitation(
    token: str,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    redis: Annotated[Redis, Depends(redis_helper.client_getter)],
):
    data = await get_invitation(redis, token)
    if not data:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Invitation not found or expired"
        )

    org_id = await get_org_by_id(session, uuid.UUID(data["org_id"]))
    if not org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")

    result = await session.execute(select(User).where(User.email == data["email"]))
    is_registered = result.scalar_one_or_none() is not None

    return InviteRead(
        org_name=org.name,
        email=data["email"],
        position=data["position"],
        is_registered=is_registered,
    )


@invitations_router.post(
    "/{token}/accept",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def accept_invitation(
    token: str,
    current_user: Annotated[User, auth_guard],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    redis: Annotated[Redis, Depends(redis_helper.client_getter)],
):
    data = await get_invitation(redis, token)
    if not data:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Invitation not found or expired"
        )

    if current_user.email != data["email"]:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Invitation is for a different email"
        )

    org_id = await get_org_by_id(session, uuid.UUID(data["org_id"]))
    if not org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")

    already_member = await get_member(session, org_id, current_user.id)
    if already_member:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Already a member of this organization"
        )

    await create_membership(
        session,
        user_id=current_user.id,
        org_id=org_id,
        role=OrgRole(data["role"]),
        position=data["position"],
    )
    await delete_invitation(redis, token)
