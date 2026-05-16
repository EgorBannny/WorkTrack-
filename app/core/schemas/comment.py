import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from .user import UserRead


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    content: str
    created_at: datetime
    updated_at: datetime
    author: UserRead | None


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str
