import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.members import get_member
from .organizations import get_org_or_404
from app.core.models import db_helper, Organization, UserOrganization


async def get_member_or_404(
    user_id: uuid.UUID,
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> UserOrganization:
    uo = await get_member(session, org.id, user_id)
    if not uo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    return uo
