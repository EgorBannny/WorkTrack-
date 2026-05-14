import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.tasks import get_task_by_id
from app.api.dependencies.projects import get_project_or_404
from app.core.models import db_helper, Project, Task


async def get_task_or_404(
    task_id: uuid.UUID,
    project: Annotated[Project, Depends(get_project_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> Task:
    task = await get_task_by_id(session, task_id)
    if not task or task.project_id != project.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return task
