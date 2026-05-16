import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.attachments import get_attachment_by_id
from .tasks import get_task_or_404
from app.core.models import db_helper, Task, Attachment


async def get_attachment_or_404(
    attachment_id: uuid.UUID,
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> Attachment:
    attachment = await get_attachment_by_id(session, attachment_id)
    if not attachment or attachment.task_id != task.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Attachment not found")
    return attachment
