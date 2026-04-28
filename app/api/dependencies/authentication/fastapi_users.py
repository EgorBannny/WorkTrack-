from fastapi_users import FastAPIUsers

from app.api.dependencies.authentication import get_user_manager
from app.core.models import User
from app.core.types.user_id import UserIdType
from app.core.authentication import auth_cookie_backend, auth_bearer_backend


fastapi_users = FastAPIUsers[User, UserIdType](
    get_user_manager,
    [auth_cookie_backend, auth_bearer_backend],
)
