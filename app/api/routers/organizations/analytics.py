from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.analytics import (
    get_overview,
    get_members_workload,
    get_timeline,
    get_priorities,
)
from app.api.dependencies.organizations import require_role
from app.core.config import settings
from app.core.models import db_helper, UserOrganization
from app.core.schemas import (
    OverviewRead,
    MemberWorkloadRead,
    TimelineEntryRead,
    PrioritiesRead,
)
from app.enums import OrgRole

analytics_router = APIRouter(tags=[settings.api.tags.analytics])


@analytics_router.get(
    "/{org_id}/analytics/overview",
    response_model=OverviewRead,
    status_code=status.HTTP_200_OK,
)
async def analytics_overview(
    uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_overview(session, uo.org_id)


@analytics_router.get(
    "/{org_id}/analytics/members",
    response_model=list[MemberWorkloadRead],
    status_code=status.HTTP_200_OK,
)
async def analytics_members(
    uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_members_workload(session, uo.org_id)


@analytics_router.get(
    "/{org_id}/analytics/timeline",
    response_model=list[TimelineEntryRead],
    status_code=status.HTTP_200_OK,
)
async def analytics_timeline(
    uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_timeline(session, uo.org_id)


@analytics_router.get(
    "/{org_id}/analytics/priorities",
    response_model=PrioritiesRead,
    status_code=status.HTTP_200_OK,
)
async def analytics_priorities(
    uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_priorities(session, uo.org_id)
