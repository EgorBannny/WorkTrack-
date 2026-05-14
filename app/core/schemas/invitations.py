from pydantic import BaseModel, EmailStr
from app.enums import OrgRole


class InviteRead(BaseModel):
    org_name: str
    position: str
    email: str
    is_registered: bool


class InviteCreate(BaseModel):
    email: EmailStr
    role: OrgRole = OrgRole.employee
    position: str
