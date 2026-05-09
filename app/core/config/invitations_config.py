from pydantic import BaseModel


class InvitationsConfig(BaseModel):
    ttl: int = 60 * 60 * 6
    prefix: str = "invitation:"
