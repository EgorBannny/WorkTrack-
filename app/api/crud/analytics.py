import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import Task, Project, User
from app.core.schemas.analytics import (
    OverviewRead,
    MemberWorkloadRead,
    TimelineEntryRead,
    PrioritiesRead,
)
from app.enums import TaskStatus, TaskPriority


async def get_overview(session: AsyncSession, org_id: uuid.UUID) -> OverviewRead:
    result = await session.execute(
        select(Task.status, func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(Project.org_id == org_id, Project.is_active == True)
        .group_by(Task.status)
    )
    counts = {status: count for status, count in result.all()}
    return OverviewRead(
        total=sum(counts.values()),
        backlog=counts.get(TaskStatus.backlog, 0),
        todo=counts.get(TaskStatus.todo, 0),
        in_progress=counts.get(TaskStatus.in_progress, 0),
        review=counts.get(TaskStatus.review, 0),
        done=counts.get(TaskStatus.done, 0),
    )


async def get_members_workload(
    session: AsyncSession, org_id: uuid.UUID
) -> list[MemberWorkloadRead]:
    result = await session.execute(
        select(User, func.count(Task.id).label("task_count"))
        .join(Task, Task.assignee_id == User.id)
        .join(Project, Task.project_id == Project.id)
        .where(Project.org_id == org_id, Project.is_active == True)
        .group_by(User.id)
        .order_by(func.count(Task.id).desc())
    )
    return [
        MemberWorkloadRead(user=user, task_count=count) for user, count in result.all()
    ]


async def get_timeline(
    session: AsyncSession, org_id: uuid.UUID
) -> list[TimelineEntryRead]:
    result = await session.execute(
        select(
            func.date(Task.created_at).label("date"), func.count(Task.id).label("count")
        )
        .join(Project, Task.project_id == Project.id)
        .where(Project.org_id == org_id, Project.is_active == True)
        .group_by(func.date(Task.created_at))
        .order_by(func.date(Task.created_at).asc())
    )
    return [TimelineEntryRead(date=row.date, count=row.count) for row in result.all()]


async def get_priorities(session: AsyncSession, org_id: uuid.UUID) -> PrioritiesRead:
    result = await session.execute(
        select(Task.priority, func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(Project.org_id == org_id, Project.is_active == True)
        .group_by(Task.priority)
    )
    counts = {priority: count for priority, count in result.all()}
    return PrioritiesRead(
        low=counts.get(TaskPriority.low, 0),
        medium=counts.get(TaskPriority.medium, 0),
        high=counts.get(TaskPriority.high, 0),
        critical=counts.get(TaskPriority.critical, 0),
    )
