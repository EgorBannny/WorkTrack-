import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import Organization, UserOrganization
from app.enums import OrgRole


async def get_org_by_id(
    session: AsyncSession,
    org_id: uuid.UUID,
) -> Organization | None:
    result = await session.execute(
        select(Organization).where(
            Organization.id == org_id,
            Organization.is_active == True,
        )
    )
    return result.scalar_one_or_none()


async def get_user_organizations(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> list[Organization]:
    result = await session.execute(
        select(UserOrganization)
        .where(UserOrganization.user_id == user_id)
        .join(UserOrganization.organization)
        .where(Organization.is_active == True)
        .options(selectinload(UserOrganization.organization))
    )
    return list(result.scalars().all())


async def get_user_organization(
    session: AsyncSession,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
) -> UserOrganization | None:
    result = await session.execute(
        select(UserOrganization).where(
            UserOrganization.user_id == user_id,
            UserOrganization.org_id == org_id,
        )
    )
    return result.scalar_one_or_none()


async def create_org_with_owner(
    session: AsyncSession,
    name: str,
    owner_id: uuid.UUID,
    description: str | None = None,
) -> tuple[Organization, UserOrganization]:
    org = Organization(name=name, description=description)
    session.add(org)
    await session.flush()

    uo = UserOrganization(user_id=owner_id, org_id=org.id, role=OrgRole.owner)
    session.add(uo)
    await session.commit()
    await session.refresh(org)
    await session.refresh(uo)
    return org, uo


async def update_org(
    session: AsyncSession,
    org: Organization,
    data: dict,
) -> Organization:
    for key, value in data.items():
        setattr(org, key, value)
    session.add(org)
    await session.commit()
    await session.refresh(org)
    return org


async def archive_org(
    session: AsyncSession,
    org: Organization,
) -> Organization:
    org.is_active = False
    session.add(org)
    await session.commit()
    await session.refresh(org)
    return org
