from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.leave_requests import (
    get_pending_leave_requests,
    get_existing_pending,
    create_leave_request,
    approve_leave_request,
    reject_leave_request,
)
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import (
    get_current_user_organization,
    require_role,
)
from app.api.dependencies.leave_requests import get_leave_request_or_404
from app.core.config import settings
from app.core.models import db_helper, User, UserOrganization, LeaveRequest
from app.core.schemas.leave_request import LeaveRequestRead
from app.enums import OrgRole

leave_requests_router = APIRouter(tags=[settings.api.tags.leave_requests])


@leave_requests_router.post(
    "/{org_id}/leave-request",
    response_model=LeaveRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_org_leave_request(
    current_user: Annotated[User, auth_guard],
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if uo.role == OrgRole.owner:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Owner cannot leave the organization"
        )

    existing = await get_existing_pending(session, current_user.id, uo.org_id)
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Leave request already pending")

    return await create_leave_request(session, current_user.id, uo.org_id)


@leave_requests_router.get(
    "/{org_id}/leave-requests",
    response_model=list[LeaveRequestRead],
    status_code=status.HTTP_200_OK,
)
async def list_leave_requests(
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    _: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_pending_leave_requests(session, uo.org_id)


@leave_requests_router.post(
    "/{org_id}/leave-requests/{request_id}/approve",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def approve_org_leave_request(
    uo: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    request: Annotated[LeaveRequest, Depends(get_leave_request_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    requester_uo = await session.get(
        UserOrganization, (request.user_id, request.org_id)
    )
    if requester_uo and requester_uo.role == OrgRole.admin and uo.role != OrgRole.owner:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only owner can approve admin leave requests"
        )
    await approve_leave_request(session, request)


@leave_requests_router.post(
    "/{org_id}/leave-requests/{request_id}/reject",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def reject_org_leave_request(
    uo: Annotated[UserOrganization, Depends(require_role(OrgRole.admin))],
    request: Annotated[LeaveRequest, Depends(get_leave_request_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    requester_uo = await session.get(
        UserOrganization, (request.user_id, request.org_id)
    )
    if requester_uo and requester_uo.role == OrgRole.admin and uo.role != OrgRole.owner:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only owner can reject admin leave requests"
        )
    await reject_leave_request(session, request)
