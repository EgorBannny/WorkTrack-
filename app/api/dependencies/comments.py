import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.comments import get_comment_by_id
from app.api.dependencies.tasks import get_task_or_404
from app.core.models import db_helper, Task, Comment


async def get_comment_or_404(
    comment_id: uuid.UUID,
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
) -> Comment:
    comment = await get_comment_by_id(session, comment_id)
    if not comment or comment.task_id != task.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found")
    return comment
