import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import TimestampMixin
from app.enums import OrgRole

if TYPE_CHECKING:
    from ..user import User
    from .organization import Organization


class UserOrganization(Base, TimestampMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[OrgRole] = mapped_column(SAEnum(OrgRole), nullable=False)
    position: Mapped[str | None] = mapped_column(
        String(100), default=None, nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="user_organizations")
    organization: Mapped["Organization"] = relationship(
        back_populates="user_organizations"
    )
