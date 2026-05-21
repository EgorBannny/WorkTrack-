import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.core.schemas.user import UserRead
from app.enums.organization import LeaveRequestStatus


class LeaveRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    status: LeaveRequestStatus
    created_at: datetime
    user: UserRead
