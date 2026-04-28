from fastapi import APIRouter
from app.core.config.main_config import settings
from .cookie import cookie_router
from .bearer import bearer_router

auth_router = APIRouter(
    prefix=settings.api.v1.prefix.auth,
    tags=[settings.api.v1.tags.auth],
)

auth_router.include_router(router=cookie_router)
auth_router.include_router(router=bearer_router)
