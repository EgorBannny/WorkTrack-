from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from ..models.mixins.itd_id_pk import IntIdPkMixin


class User(IntIdPkMixin, Base):
    username: Mapped[str] = mapped_column(unique=True)
