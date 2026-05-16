import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import UUIDPKMixin, TimestampMixin

if TYPE_CHECKING:
    from .task import Task
    from ..user import User


class Comment(Base, UUIDPKMixin, TimestampMixin):
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    task: Mapped["Task"] = relationship(back_populates="comments")
    author: Mapped["User | None"] = relationship(foreign_keys=[author_id])
