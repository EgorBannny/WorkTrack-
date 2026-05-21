import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.leave_requests import get_leave_request_by_id
from app.api.dependencies.organizations import get_current_user_organization
from app.core.models import db_helper, UserOrganization
from app.core.models.organization.leave_request import LeaveRequest
from app.enums.organization import LeaveRequestStatus


async def get_leave_request_or_404(
    request_id: uuid.UUID,
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> LeaveRequest:
    request = await get_leave_request_by_id(session, request_id)
    if not request or request.org_id != uo.org_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave request not found")
    if request.status != LeaveRequestStatus.pending:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Leave request is already resolved"
        )
    return request
