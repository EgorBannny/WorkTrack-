from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from .base import Base

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class User(Base, SQLAlchemyBaseUserTableUUID):

    token_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    has_avatar: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    @classmethod
    def get_db(cls, session: "AsyncSession") -> SQLAlchemyUserDatabase:
        return SQLAlchemyUserDatabase(session, User)
