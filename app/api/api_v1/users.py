from fastapi import APIRouter
from app.core.config.main_config import settings

users_router = APIRouter(
    prefix=settings.api.v1.prefix.users,
    tags=[settings.api.v1.tags.users],
)
