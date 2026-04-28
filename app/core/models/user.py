from typing import TYPE_CHECKING
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column
from fastapi_users.db import SQLAlchemyBaseUserTable, SQLAlchemyUserDatabase
from .base import Base
from app.core.models.mixins.itd_id_pk import IntIdPkMixin
from app.core.types.user_id import UserIdType

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class User(Base, IntIdPkMixin, SQLAlchemyBaseUserTable[UserIdType]):

    token_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    @classmethod
    def get_db(cls, session: "AsyncSession") -> SQLAlchemyUserDatabase:
        return SQLAlchemyUserDatabase(session, User)
