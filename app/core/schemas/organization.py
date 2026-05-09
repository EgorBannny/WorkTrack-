import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.enums import OrgRole


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    is_active: bool
    created_at: datetime


class OrganizationWithRoleRead(OrganizationRead):
    role: OrgRole
    position: str | None = None


class OrganizationCreate(BaseModel):
    name: str


class OrganizationUpdate(BaseModel):
    name: str | None = None
