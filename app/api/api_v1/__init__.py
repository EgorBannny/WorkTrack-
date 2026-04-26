from fastapi import APIRouter
from app.core.config.main_config import settings
from .users import users_router

api_v1_router = APIRouter(prefix=settings.api.v1.prefix.v1)
api_v1_router.include_router(router=users_router)
