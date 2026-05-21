from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.organizations import (
    create_org_with_owner,
    get_user_organizations,
    update_org,
    archive_org,
)
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import (
    get_org_or_404,
    get_current_user_organization,
    require_role,
)
from app.core.config import settings
from app.core.models import db_helper, User, Organization, UserOrganization
from app.core.schemas import (
    OrganizationCreate,
    OrganizationRead,
    OrganizationUpdate,
    OrganizationWithRoleRead,
)
from app.enums import OrgRole

from .members import members_router
from .projects import (
    projects_router,
    tasks_router,
    comments_router,
    attachments_router,
)
from .analytics import analytics_router
from .org_avatar import org_avatar_router
from .leave_requests import leave_requests_router

organizations_router = APIRouter(
    prefix=settings.api.prefix.orgs,
    tags=[settings.api.tags.orgs],
)
organizations_router.include_router(router=members_router)
organizations_router.include_router(router=projects_router)
organizations_router.include_router(router=tasks_router)
organizations_router.include_router(router=comments_router)
organizations_router.include_router(router=attachments_router)
organizations_router.include_router(router=analytics_router)
organizations_router.include_router(router=org_avatar_router)
organizations_router.include_router(router=leave_requests_router)


@organizations_router.get(
    "/me",
    response_model=list[OrganizationWithRoleRead],
    status_code=status.HTTP_200_OK,
)
async def get_my_organizations(
    current_user: Annotated[User, auth_guard],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    user_orgs = await get_user_organizations(session, current_user.id)
    return [
        OrganizationWithRoleRead(
            id=uo.organization.id,
            name=uo.organization.name,
            description=uo.organization.description,
            is_active=uo.organization.is_active,
            created_at=uo.organization.created_at,
            role=uo.role,
            position=uo.position,
        )
        for uo in user_orgs
    ]


@organizations_router.get(
    "/{org_id}",
    response_model=OrganizationWithRoleRead,
    status_code=status.HTTP_200_OK,
)
async def get_organization(
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    org: Annotated[Organization, Depends(get_org_or_404)],
):
    return OrganizationWithRoleRead(
        id=org.id,
        name=org.name,
        description=org.description,
        is_active=org.is_active,
        created_at=org.created_at,
        role=uo.role,
        position=uo.position,
    )


@organizations_router.post(
    "",
    response_model=OrganizationWithRoleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization(
    data: OrganizationCreate,
    current_user: Annotated[User, auth_guard],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    org, uo = await create_org_with_owner(session, data.name, current_user.id, data.description)

    return OrganizationWithRoleRead(
        id=org.id,
        name=org.name,
        description=org.description,
        is_active=org.is_active,
        created_at=org.created_at,
        role=uo.role,
        position=uo.position,
    )


@organizations_router.patch(
    "/{org_id}",
    response_model=OrganizationRead,
    status_code=status.HTTP_200_OK,
)
async def update_organization(
    data: OrganizationUpdate,
    _: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return org
    return await update_org(session, org, update_data)


@organizations_router.delete(
    "/{org_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def archive_organization(
    _: Annotated[UserOrganization, Depends(require_role(OrgRole.owner))],
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if not org.is_active:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Organization is already archived"
        )
    await archive_org(session, org)
