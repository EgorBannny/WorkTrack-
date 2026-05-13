import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.projects import get_project_by_id, get_user_project
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import get_current_user_organization
from app.core.models import db_helper, User, Organization, Project, UserProject


async def get_project_or_404(
    project_id: uuid.UUID,
    _: Annotated[Organization, Depends(get_current_user_organization)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> Project:
    project = await get_project_by_id(session, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


async def get_current_user_project(
    current_user: Annotated[User, auth_guard],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> UserProject:
    up = await get_user_project(session, current_user.id, project.id)
    if not up:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You are not a member of this project"
        )
    return up
