from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import UUIDPKMixin, TimestampMixin

if TYPE_CHECKING:
    from .user_organization import UserOrganization
    from ..project import Project


class Organization(Base, UUIDPKMixin, TimestampMixin):
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user_organizations: Mapped[list["UserOrganization"]] = relationship(
        back_populates="organization"
    )

    projects: Mapped[list["Project"]] = relationship(back_populates="organization")
