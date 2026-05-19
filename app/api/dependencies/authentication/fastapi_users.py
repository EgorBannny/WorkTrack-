# utils
import uuid

# core
from app.core.models import User
from app.core.authentication import auth_cookie_backend, auth_bearer_backend

# fastapi
from fastapi import Depends
from fastapi_users import FastAPIUsers

# inside the package
from .user_manager import get_user_manager

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_cookie_backend, auth_bearer_backend],
)

auth_guard = Depends(fastapi_users.current_user(active=True))
