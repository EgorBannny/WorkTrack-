from typing import TYPE_CHECKING
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from .helpers import Base

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from .user_organization import UserOrganization
    from .user_project import UserProject


class User(Base, SQLAlchemyBaseUserTableUUID):

    token_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)

    user_organizations: Mapped[list["UserOrganization"]] = relationship(
        back_populates="user"
    )

    user_projects: Mapped[list["UserProject"]] = relationship(back_populates="user")

    @classmethod
    def get_db(cls, session: "AsyncSession") -> SQLAlchemyUserDatabase:
        return SQLAlchemyUserDatabase(session, User)
