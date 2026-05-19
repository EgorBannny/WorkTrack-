from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User, UserOrganization, Organization
from app.enums import OrgRole


async def deactivate_user(session: AsyncSession, user: User) -> None:
    owned_orgs = await session.execute(
        select(Organization)
        .join(UserOrganization, UserOrganization.org_id == Organization.id)
        .where(
            UserOrganization.user_id == user.id,
            UserOrganization.role == OrgRole.owner,
            Organization.is_active == True,
        )
    )
    for org in owned_orgs.scalars().all():
        org.is_active = False

    user.is_active = False
    await session.commit()
