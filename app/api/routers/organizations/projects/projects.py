import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.projects import (
    get_org_projects,
    create_project,
    update_project,
    archive_project,
    get_project_members,
    get_user_project,
    add_project_member,
    remove_project_member,
)
from app.api.crud.organizations import get_user_organization
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import (
    get_org_or_404,
    get_current_user_organization,
    require_role,
)
from app.api.dependencies.projects import get_project_or_404, get_current_user_project
from app.core.models import (
    db_helper,
    User,
    Organization,
    UserOrganization,
    Project,
    UserProject,
)
from app.core.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    UserProjectRead,
)
from app.enums import OrgRole
from app.core.config import settings

projects_router = APIRouter(tags=[settings.api.tags.projects])


@projects_router.get(
    "/{org_id}/projects",
    response_model=list[ProjectRead],
    status_code=status.HTTP_200_OK,
)
async def get_projects(
    _: Annotated[UserOrganization, Depends(get_current_user_organization)],
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_org_projects(session, org.id)


@projects_router.get(
    "/{org_id}/projects/{project_id}",
    response_model=ProjectRead,
    status_code=status.HTTP_200_OK,
)
async def get_project(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    project: Annotated[Project, Depends(get_project_or_404)],
):
    return project


@projects_router.get(
    "/{org_id}/projects/{project_id}/members",
    response_model=list[UserProjectRead],
    status_code=status.HTTP_200_OK,
)
async def get_project_members_list(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_project_members(session, project.id)


@projects_router.post(
    "/{org_id}/projects/{project_id}/members",
    response_model=UserProjectRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_member_to_project(
    user_id: uuid.UUID,
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    org_member = await get_user_organization(session, user_id, project.org_id)
    if not org_member:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "User is not a member of this organization"
        )

    already_in_project = await get_user_project(session, user_id, project.id)
    if already_in_project:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "User is already a member of this project"
        )

    return await add_project_member(session, user_id, project.id)


@projects_router.post(
    "/{org_id}/projects",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_org_project(
    data: ProjectCreate,
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    current_user: Annotated[User, auth_guard],
    org: Annotated[Organization, Depends(get_org_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await create_project(
        session=session,
        org_id=org.id,
        created_by=current_user.id,
        name=data.name,
        description=data.description,
    )


@projects_router.patch(
    "/{org_id}/projects/{project_id}",
    response_model=ProjectRead,
    status_code=status.HTTP_200_OK,
)
async def update_org_project(
    data: ProjectUpdate,
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return project
    return await update_project(session, project, update_data)


@projects_router.delete(
    "/{org_id}/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def archive_org_project(
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    await archive_project(session, project)


@projects_router.delete(
    "/{org_id}/projects/{project_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_member_from_project(
    user_id: uuid.UUID,
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    up = await get_user_project(session, user_id, project.id)
    if not up:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "User is not a member of this project"
        )
    await remove_project_member(session, up)
