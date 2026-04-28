from fastapi import APIRouter
from app.core.config.main_config import settings
from .auth import auth_router
from .users import users_router

router = APIRouter()
router.include_router(router=auth_router)
router.include_router(router=users_router)
