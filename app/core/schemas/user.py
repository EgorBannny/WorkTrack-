import uuid

from fastapi_users.schemas import BaseUser, BaseUserCreate, BaseUserUpdate


class UserRead(BaseUser[uuid.UUID]):
    display_name: str


class UserCreate(BaseUserCreate):
    display_name: str


class UserUpdate(BaseUserUpdate):
    display_name: str | None = None
