from pydantic import BaseModel


class APIV1Tags(BaseModel):
    users: str = "Users"


class APIV1Prefix(BaseModel):
    v1: str = "/v1"
    users: str = "/users"


class APIV1Config(BaseModel):
    tags: APIV1Tags = APIV1Tags()
    prefix: APIV1Prefix = APIV1Prefix()


class APIConfig(BaseModel):
    prefix: str = "/api"
    v1: APIV1Config = APIV1Config()
