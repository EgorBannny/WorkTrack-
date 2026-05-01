import uuid

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    token_version: int = 1


class UserCreate(schemas.BaseUserCreate):
    token_version: int = 1


class UserUpdate(schemas.BaseUserUpdate):
    token_version: int = 1
