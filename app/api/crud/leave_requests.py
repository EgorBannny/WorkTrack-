import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import UserOrganization
from app.core.models.organization.leave_request import LeaveRequest
from app.enums.organization import LeaveRequestStatus


async def get_leave_request_by_id(
    session: AsyncSession, request_id: uuid.UUID
) -> LeaveRequest | None:
    result = await session.execute(
        select(LeaveRequest)
        .where(LeaveRequest.id == request_id)
        .options(selectinload(LeaveRequest.user))
    )
    return result.scalar_one_or_none()


async def get_pending_leave_requests(
    session: AsyncSession, org_id: uuid.UUID
) -> list[LeaveRequest]:
    result = await session.execute(
        select(LeaveRequest)
        .where(
            LeaveRequest.org_id == org_id,
            LeaveRequest.status == LeaveRequestStatus.pending,
        )
        .options(selectinload(LeaveRequest.user))
        .order_by(LeaveRequest.created_at.asc())
    )
    return list(result.scalars().all())


async def get_existing_pending(
    session: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID
) -> LeaveRequest | None:
    result = await session.execute(
        select(LeaveRequest).where(
            LeaveRequest.user_id == user_id,
            LeaveRequest.org_id == org_id,
            LeaveRequest.status == LeaveRequestStatus.pending,
        )
    )
    return result.scalar_one_or_none()


async def create_leave_request(
    session: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID
) -> LeaveRequest:
    request = LeaveRequest(user_id=user_id, org_id=org_id)
    session.add(request)
    await session.commit()
    await session.refresh(request, attribute_names=["user"])
    return request


async def approve_leave_request(session: AsyncSession, request: LeaveRequest) -> None:
    uo = await session.get(UserOrganization, (request.user_id, request.org_id))
    if uo:
        await session.delete(uo)
    request.status = LeaveRequestStatus.approved
    await session.commit()


async def reject_leave_request(session: AsyncSession, request: LeaveRequest) -> None:
    request.status = LeaveRequestStatus.rejected
    await session.commit()
