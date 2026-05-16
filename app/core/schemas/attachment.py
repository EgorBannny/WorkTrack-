import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from .user import UserRead


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    filename: str
    mime_type: str
    file_size: int
    created_at: datetime
    uploader: UserRead | None
