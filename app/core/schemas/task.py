import uuid
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict
from app.enums.task import TaskStatus, TaskPriority
from app.core.schemas.user import UserRead


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    position: int
    due_date: date | None
    created_at: datetime
    updated_at: datetime
    creator: UserRead | None
    assignee: UserRead | None


class TaskHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    field_changed: str
    old_value: str | None
    new_value: str | None
    created_at: datetime
    user: UserRead | None


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: TaskPriority = TaskPriority.medium
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None


class TaskPositionUpdate(BaseModel):
    position: int
