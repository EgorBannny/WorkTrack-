from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from app.core.config.main_config import settings
from .auth import auth_router
from .users import users_router

http_bearer = HTTPBearer()

api_v1_router = APIRouter(
    prefix=settings.api.v1.prefix.v1,
    dependencies=[Depends(http_bearer)],
)
api_v1_router.include_router(router=auth_router)
api_v1_router.include_router(router=users_router)
