import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import TimestampMixin

if TYPE_CHECKING:
    from ..user import User
    from .project import Project


class UserProject(Base, TimestampMixin):

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )

    user: Mapped["User"] = relationship(back_populates="user_projects")
    project: Mapped["Project"] = relationship(back_populates="user_projects")
