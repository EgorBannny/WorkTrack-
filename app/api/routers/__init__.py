from fastapi import APIRouter
from .auth import auth_router
from .users import users_router
from .organizations import organizations_router
from .invitations import invitations_router

router = APIRouter()
router.include_router(router=auth_router)
router.include_router(router=users_router)
router.include_router(router=organizations_router)
router.include_router(router=invitations_router)
