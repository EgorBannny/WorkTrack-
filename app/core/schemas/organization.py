import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.enums import OrgRole
from .user import UserRead


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
    created_at: datetime


class OrganizationWithRoleRead(OrganizationRead):
    role: OrgRole
    position: str | None = None


class UserOrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    org_id: uuid.UUID
    role: OrgRole
    position: str | None = None
    created_at: datetime
    user: UserRead


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
