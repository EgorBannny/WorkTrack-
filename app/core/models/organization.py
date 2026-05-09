from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins import UUIDPKMixin, TimestampMixin

if TYPE_CHECKING:
    from .user_organization import Organization


class Organization(Base, UUIDPKMixin, TimestampMixin):
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user_organizations: Mapped[list["Organization"]] = relationship(
        back_populates="organization"
    )
