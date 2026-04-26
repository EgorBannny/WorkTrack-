from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import MetaData
from app.utils import camel_case_to_snake_case
from app.core.config.main_config import settings


class Base(DeclarativeBase):
    __abstract__ = True

    metadata = MetaData(
        naming_convention=settings.db.pg.naming_convention,
    )

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return f"{camel_case_to_snake_case(cls.__name__)}s"
