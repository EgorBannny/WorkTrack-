from pydantic import BaseModel


class APITags(BaseModel):
    auth: str = "Auth"
    cookie: str = "Cookie"
    bearer: str = "Bearer"
    users: str = "Users"


class APIPrefix(BaseModel):
    api: str = "/api"
    auth: str = "/auth"
    cookie: str = "/cookie"
    bearer: str = "/bearer"
    users: str = "/users"


class APIConfig(BaseModel):
    tags: APITags = APITags()
    prefix: APIPrefix = APIPrefix()

    @property
    def bearer_token_url(self) -> str:
        parts = (
            self.prefix.api,
            self.prefix.auth,
            self.prefix.bearer,
            "/login",
        )
        path = "".join(parts)
        return path.removeprefix("/")
