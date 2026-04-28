from pydantic import BaseModel


class APIV1Tags(BaseModel):
    auth: str = "Auth"
    cookie: str = "Cookie"
    bearer: str = "Bearer"


class APIV1Prefix(BaseModel):
    v1: str = "/v1"
    auth: str = "/auth"
    cookie: str = "/cookie/jwt"
    bearer: str = "/bearer/jwt"


class APIV1Config(BaseModel):
    tags: APIV1Tags = APIV1Tags()
    prefix: APIV1Prefix = APIV1Prefix()


class APIConfig(BaseModel):
    prefix: str = "/api"
    v1: APIV1Config = APIV1Config()
