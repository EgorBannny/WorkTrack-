import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import Project, UserProject


async def get_project_by_id(
    session: AsyncSession,
    project_id: uuid.UUID,
) -> Project | None:
    result = await session.execute(
        select(Project)
        .where(Project.id == project_id, Project.is_active == True)
        .options(
            selectinload(Project.creator),
            selectinload(Project.user_projects).selectinload(UserProject.user),
        )
    )
    return result.scalar_one_or_none()


async def get_org_projects(
    session: AsyncSession,
    org_id: uuid.UUID,
) -> list[Project]:
    result = await session.execute(
        select(Project)
        .where(Project.org_id == org_id, Project.is_active == True)
        .options(
            selectinload(Project.creator),
            selectinload(Project.user_projects).selectinload(UserProject.user),
        )
    )
    return list(result.scalars().all())


async def get_project_members(
    session: AsyncSession,
    project_id: uuid.UUID,
) -> list[UserProject]:
    result = await session.execute(
        select(UserProject)
        .where(UserProject.project_id == project_id)
        .options(selectinload(UserProject.user))
    )
    return list(result.scalars().all())


async def get_user_project(
    session: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
) -> UserProject | None:
    result = await session.execute(
        select(UserProject).where(
            UserProject.user_id == user_id,
            UserProject.project_id == project_id,
        )
    )
    return result.scalar_one_or_none()


async def create_project(
    session: AsyncSession,
    org_id: uuid.UUID,
    created_by: uuid.UUID,
    name: str,
    description: str | None = None,
) -> Project:
    project = Project(
        org_id=org_id, created_by=created_by, name=name, description=description
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    await session.refresh(project, attribute_names=["creator"])
    return project


async def add_project_member(
    session: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
) -> UserProject:
    up = UserProject(user_id=user_id, project_id=project_id)
    session.add(up)
    await session.commit()
    result = await session.execute(
        select(UserProject)
        .where(UserProject.user_id == user_id, UserProject.project_id == project_id)
        .options(selectinload(UserProject.user))
    )
    return result.scalar_one()


async def update_project(
    session: AsyncSession,
    project: Project,
    data: dict,
) -> Project:
    for key, value in data.items():
        setattr(project, key, value)
    session.add(project)
    await session.commit()
    await session.refresh(project)
    await session.refresh(project, attribute_names=["creator"])
    return project


async def archive_project(
    session: AsyncSession,
    project: Project,
) -> None:
    project.is_active = False
    session.add(project)
    await session.commit()


async def remove_project_member(
    session: AsyncSession,
    up: UserProject,
) -> None:
    await session.delete(up)
    await session.commit()
