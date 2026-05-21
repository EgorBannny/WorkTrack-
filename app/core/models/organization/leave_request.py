import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..helpers import Base
from ..mixins import UUIDPKMixin, TimestampMixin
from app.enums.organization import LeaveRequestStatus

if TYPE_CHECKING:
    from ..user import User
    from .organization import Organization


class LeaveRequest(Base, UUIDPKMixin, TimestampMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[LeaveRequestStatus] = mapped_column(
        SAEnum(LeaveRequestStatus), default=LeaveRequestStatus.pending, nullable=False
    )

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    organization: Mapped["Organization"] = relationship(foreign_keys=[org_id])
