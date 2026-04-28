from fastapi import APIRouter
from app.core.config.main_config import settings

auth_router = APIRouter(
    prefix=settings.api.v1.prefix.auth,
    tags=[settings.api.v1.tags.auth],
)
