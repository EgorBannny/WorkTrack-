from core.types.user_id import UserIdType

from fastapi_users import FastAPIUsers

from core.models import User
from .user_manager import get_user_manager
from core.authentication import auth_cookie_backend, auth_bearer_backend


fastapi_users = FastAPIUsers[User, UserIdType](
    get_user_manager,
    [auth_cookie_backend, auth_bearer_backend],
)
