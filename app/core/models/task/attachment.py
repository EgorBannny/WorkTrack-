import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import UUIDPKMixin, TimestampMixin

if TYPE_CHECKING:
    from .task import Task
    from ..user import User


class Attachment(Base, UUIDPKMixin, TimestampMixin):
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)

    task: Mapped["Task"] = relationship(back_populates="attachments")
    uploader: Mapped["User | None"] = relationship(foreign_keys=[uploaded_by])
