import uuid
from typing import TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Boolean, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import UUIDPKMixin, TimestampMixin

if TYPE_CHECKING:
    from ..organization import Organization
    from .user_project import UserProject
    from ..user import User
    from ..task import Task


class Project(Base, UUIDPKMixin, TimestampMixin):
    org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    organization: Mapped["Organization"] = relationship(back_populates="projects")
    user_projects: Mapped[list["UserProject"]] = relationship(back_populates="project")
    creator: Mapped["User | None"] = relationship(foreign_keys=[created_by])
    tasks: Mapped[list["Task"]] = relationship(back_populates="project")
