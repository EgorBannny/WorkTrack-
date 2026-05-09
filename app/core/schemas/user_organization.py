import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.enums import OrgRole
from app.core.schemas import UserRead


class UserOrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    org_id: uuid.UUID
    role: OrgRole
    postition: str | None = None
    created_at: datetime
    user: UserRead
