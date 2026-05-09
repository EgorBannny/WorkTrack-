import json
import uuid
from redis.asyncio import Redis
from app.core.config.main_config import settings


async def create_invitation(
    redis: Redis,
    org_id: uuid.UUID,
    email: str,
    role: str,
    position: str,
    invited_by: uuid.UUID,
) -> str:
    token = str(uuid.uuid4())
    data = {
        "org_id": str(org_id),
        "email": email,
        "role": role,
        "position": position,
        "invited_by": str(invited_by),
    }
    await redis.setex(
        f"{settings.invitations.prefix}{token}",
        settings.invitations.ttl,
        json.dumps(data),
    )
    return token


async def get_invitation(
    redis: Redis,
    token: str,
) -> dict | None:
    raw = await redis.get(f"{settings.invitations.prefix}{token}")
    if not raw:
        return None
    return json.loads(raw)


async def delete_invitation(
    redis: Redis,
    token: str,
) -> None:
    await redis.delete(f"{settings.invitations.prefix}{token}")
