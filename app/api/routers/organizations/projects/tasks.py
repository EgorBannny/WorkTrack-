import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.tasks import (
    get_project_tasks,
    create_task,
    update_task,
    update_task_position,
    delete_task,
    get_task_history,
)
from app.api.crud.projects import get_user_project
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import require_role
from app.api.dependencies.projects import get_project_or_404, get_current_user_project
from app.api.dependencies.tasks import get_task_or_404
from app.core.models import (
    db_helper,
    User,
    UserOrganization,
    Project,
    UserProject,
)
from app.core.models.task import Task
from app.core.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskPositionUpdate,
    TaskRead,
    TaskHistoryRead,
)
from app.enums import TaskStatus, TaskPriority, OrgRole
from app.core.config import settings

tasks_router = APIRouter(tags=[settings.api.tags.tasks])


@tasks_router.get(
    "/{org_id}/projects/{project_id}/tasks",
    response_model=list[TaskRead],
    status_code=status.HTTP_200_OK,
)
async def get_tasks(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
    status_filter: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    assignee_id: uuid.UUID | None = None,
    search: str | None = None,
):
    return await get_project_tasks(
        session,
        project_id=project.id,
        status=status_filter,
        priority=priority,
        assignee_id=assignee_id,
        search=search,
    )


@tasks_router.get(
    "/{org_id}/projects/{project_id}/tasks/{task_id}",
    response_model=TaskRead,
    status_code=status.HTTP_200_OK,
)
async def get_task(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
):
    return task


@tasks_router.get(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/history",
    response_model=list[TaskHistoryRead],
    status_code=status.HTTP_200_OK,
)
async def get_task_history_list(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_task_history(session, task.id)


@tasks_router.post(
    "/{org_id}/projects/{project_id}/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_task(
    data: TaskCreate,
    _uo: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    current_user: Annotated[User, auth_guard],
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if data.assignee_id:
        up = await get_user_project(session, data.assignee_id, project.id)
        if not up:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Assignee is not a member of this project"
            )

    return await create_task(
        session,
        project_id=project.id,
        created_by=current_user.id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        assignee_id=data.assignee_id,
        due_date=data.due_date,
    )


@tasks_router.patch(
    "/{org_id}/projects/{project_id}/tasks/{task_id}",
    response_model=TaskRead,
    status_code=status.HTTP_200_OK,
)
async def update_project_task(
    data: TaskUpdate,
    _: Annotated[UserProject, Depends(get_current_user_project)],
    current_user: Annotated[User, auth_guard],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if data.assignee_id:
        up = await get_user_project(session, data.assignee_id, task.project_id)
        if not up:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Assignee is not a member of this project"
            )

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return task

    return await update_task(
        session=session,
        task=task,
        data=update_data,
    )


@tasks_router.patch(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/position",
    response_model=TaskRead,
    status_code=status.HTTP_200_OK,
)
async def change_task_position(
    data: TaskPositionUpdate,
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await update_task_position(session, task, data.position)


@tasks_router.delete(
    "/{org_id}/projects/{project_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project_task(
    _: Annotated[UserOrganization, Depends(require_role(OrgRole.manager))],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    await delete_task(session, task)
