import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import Task, TaskHistory
from app.enums import TaskStatus, TaskPriority


async def get_task_by_id(
    session: AsyncSession,
    task_id: uuid.UUID,
) -> Task | None:
    result = await session.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.creator),
            selectinload(Task.assignee),
        )
    )
    return result.scalar_one_or_none()


async def get_project_tasks(
    session: AsyncSession,
    project_id: uuid.UUID,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    assignee_id: uuid.UUID | None = None,
    search: str | None = None,
) -> list[Task]:
    query = (
        select(Task)
        .where(Task.project_id == project_id)
        .options(
            selectinload(Task.creator),
            selectinload(Task.assignee),
        )
        .order_by(Task.position)
    )
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
    if search:
        query = query.where(Task.title.ilike(f"%{search}%"))

    result = await session.execute(query)
    return list(result.scalars().all())


async def get_task_history(
    session: AsyncSession,
    task_id: uuid.UUID,
) -> list[TaskHistory]:
    result = await session.execute(
        select(TaskHistory)
        .where(TaskHistory.task_id == task_id)
        .options(selectinload(TaskHistory.user))
        .order_by(TaskHistory.created_at.desc())
    )
    return list(result.scalars().all())


async def create_task(
    session: AsyncSession,
    project_id: uuid.UUID,
    created_by: uuid.UUID,
    title: str,
    description: str | None = None,
    priority: TaskPriority = TaskPriority.medium,
    assignee_id: uuid.UUID | None = None,
    due_date=None,
) -> Task:
    task = Task(
        project_id=project_id,
        created_by=created_by,
        title=title,
        description=description,
        priority=priority,
        assignee_id=assignee_id,
        due_date=due_date,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task, attribute_names=["creator", "assignee"])
    return task


async def update_task(
    session: AsyncSession,
    task: Task,
    data: dict,
) -> Task:
    old_values = {}
    for key, value in data.items():
        old_values[key] = getattr(task, key)
        setattr(task, key, value)

    session.add(task)
    await session.flush()

    for field, old_value in old_values.items():
        new_value = getattr(task, field)
        if str(old_value) != str(new_value):
            history = TaskHistory(
                task_id=task.id,
                field_changed=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
            )
            session.add(history)

    await session.commit()
    result = await session.execute(
        select(Task)
        .where(Task.id == task.id)
        .options(selectinload(Task.creator), selectinload(Task.assignee))
    )
    return result.scalar_one()


async def update_task_position(
    session: AsyncSession,
    task: Task,
    position: int,
) -> Task:
    task.position = position
    session.add(task)
    await session.commit()
    return task


async def delete_task(
    session: AsyncSession,
    task: Task,
) -> None:
    await session.delete(task)
    await session.commit()
