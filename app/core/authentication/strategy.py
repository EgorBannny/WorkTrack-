from fastapi_users.authentication import JWTStrategy
from core.config.main_config import settings


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.auth.jwt.private_key_path.read_text(),
        lifetime_seconds=settings.auth.jwt.access_token_lifetime_secondss,
        algorithm=settings.auth.jwt.algorithm,
        public_key=settings.auth.jwt.public_key_path.read_text(),
    )
