from pydantic import BaseModel
from app.enums import OrgRole


class MemberUpdate(BaseModel):
    role: OrgRole | None = None
    position: str | None = None
