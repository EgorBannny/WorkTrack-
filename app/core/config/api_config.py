from pydantic import BaseModel


class APITags(BaseModel):
    auth: str = "Auth"
    cookie: str = "Cookie"
    bearer: str = "Bearer"
    users: str = "Users"
    avatar: str = "Avatar"
    orgs: str = "Organizations"
    members: str = "Members"
    invitations: str = "Invitations"
    projects: str = "Projects"
    tasks: str = "Tasks"
    comments: str = "Comments"
    attachments: str = "Attachments"
    analytics: str = "Analytics"
    leave_requests: str = "Leave Requests"


class APIPrefix(BaseModel):
    api: str = "/api"
    auth: str = "/auth"
    cookie: str = "/cookie"
    bearer: str = "/bearer"
    users: str = "/users"
    avatar: str = "/avatar"
    orgs: str = "/orgs"
    invitations: str = "/invitations"


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
