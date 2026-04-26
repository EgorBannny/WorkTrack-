from fastapi import APIRouter
from app.core.config.main_config import settings
from .api_v1 import api_v1_router

api_router = APIRouter(prefix=settings.api.prefix)
api_router.include_router(router=api_v1_router)
