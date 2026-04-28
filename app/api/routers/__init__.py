from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from .auth import auth_router
from .users import users_router

http_bearer = HTTPBearer()

router = APIRouter(dependencies=[Depends(http_bearer)])
router.include_router(router=auth_router)
router.include_router(router=users_router)
