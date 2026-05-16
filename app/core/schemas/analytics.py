from datetime import date
from pydantic import BaseModel
from .user import UserRead


class OverviewRead(BaseModel):
    total: int
    backlog: int
    todo: int
    in_progress: int
    review: int
    done: int


class MemberWorkloadRead(BaseModel):
    user: UserRead
    task_count: int


class TimelineEntryRead(BaseModel):
    date: date
    count: int


class PrioritiesRead(BaseModel):
    low: int
    medium: int
    high: int
    critical: int
