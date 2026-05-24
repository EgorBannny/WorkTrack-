import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import UserOrganization
from app.enums import OrgRole


async def get_org_members(
    session: AsyncSession,
    org_id: uuid.UUID,
) -> list[UserOrganization]:
    result = await session.execute(
        select(UserOrganization)
        .where(UserOrganization.org_id == org_id)
        .options(selectinload(UserOrganization.user))
    )
    return list(result.scalars().all())


async def get_member(
    session: AsyncSession,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
) -> UserOrganization | None:
    result = await session.execute(
        select(UserOrganization).where(
            UserOrganization.org_id == org_id,
            UserOrganization.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_membership(
    session: AsyncSession,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    role: OrgRole,
    position: str,
) -> UserOrganization:
    uo = UserOrganization(
        user_id=user_id,
        org_id=org_id,
        role=role,
        position=position,
    )
    session.add(uo)
    await session.commit()
    await session.refresh(uo)
    return uo


async def update_member(
    session: AsyncSession,
    uo: UserOrganization,
    role: OrgRole | None = None,
    position: str | None = None,
) -> UserOrganization:
    if role is not None:
        uo.role = role
    if position is not None:
        uo.position = position
    session.add(uo)
    await session.commit()
    result = await session.execute(
        select(UserOrganization)
        .where(
            UserOrganization.user_id == uo.user_id,
            UserOrganization.org_id == uo.org_id,
        )
        .options(selectinload(UserOrganization.user))
    )
    return result.scalar_one()


async def remove_member(
    session: AsyncSession,
    uo: UserOrganization,
) -> None:
    await session.delete(uo)
    await session.commit()
