from pydantic import BaseModel


class APIV1Tags(BaseModel):
    auth: str = "Auth"
    cookie: str = "Cookie"
    bearer: str = "Bearer"
    users: str = "Users"


class APIV1Prefix(BaseModel):
    v1: str = "/v1"
    auth: str = "/auth"
    cookie: str = "/cookie"
    bearer: str = "/bearer"
    users: str = "/users"


class APIV1Config(BaseModel):
    tags: APIV1Tags = APIV1Tags()
    prefix: APIV1Prefix = APIV1Prefix()


class APIConfig(BaseModel):
    prefix: str = "/api"
    v1: APIV1Config = APIV1Config()

    @property
    def bearer_token_url(self) -> str:
        parts = (
            self.prefix,
            self.v1.prefix.v1,
            self.v1.prefix.auth,
            self.v1.prefix.bearer,
            "/login",
        )
        path = "".join(parts)
        return path.removeprefix("/")
