from app.core.types.user_id import UserIdType

from fastapi_users import schemas


class UserRead(schemas.BaseUser[UserIdType]):
    token_version: int = 1


class UserCreate(schemas.BaseUserCreate):
    token_version: int = 1


class UserUpdate(schemas.BaseUserUpdate):
    token_version: int = 1
