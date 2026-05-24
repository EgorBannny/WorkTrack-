import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.organizations import get_org_by_id, get_user_organization
from app.api.dependencies.authentication import auth_guard
from app.core.models import db_helper, User, Organization, UserOrganization
from app.enums import OrgRole, ROLE_HIERARCHY


async def get_org_or_404(
    org_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> Organization:
    org = await get_org_by_id(session, org_id)
    if not org:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    return org


async def get_current_user_organization(
    current_user: Annotated[User, auth_guard],
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> UserOrganization:
    uo = await get_user_organization(session, current_user.id, org.id)
    if not uo:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Organization not found"
        )
    return uo


def require_role(min_role: OrgRole):
    async def dependency(
        uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    ) -> UserOrganization:
        if ROLE_HIERARCHY[uo.role] < ROLE_HIERARCHY[min_role]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return uo

    return dependency
