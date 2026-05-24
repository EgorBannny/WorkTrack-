import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models import Comment


async def get_task_comments(
    session: AsyncSession,
    task_id: uuid.UUID,
) -> list[Comment]:
    result = await session.execute(
        select(Comment)
        .where(Comment.task_id == task_id)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at.asc())
    )
    return list(result.scalars().all())


async def get_comment_by_id(
    session: AsyncSession,
    comment_id: uuid.UUID,
) -> Comment | None:
    result = await session.execute(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(selectinload(Comment.author))
    )
    return result.scalar_one_or_none()


async def create_comment(
    session: AsyncSession,
    task_id: uuid.UUID,
    author_id: uuid.UUID,
    content: str,
) -> Comment:
    comment = Comment(
        task_id=task_id,
        author_id=author_id,
        content=content,
    )
    session.add(comment)
    await session.commit()
    await session.refresh(comment, attribute_names=["author"])
    return comment


async def update_comment(
    session: AsyncSession,
    comment: Comment,
    content: str,
) -> Comment:
    comment.content = content
    await session.commit()
    result = await session.execute(
        select(Comment)
        .where(Comment.id == comment.id)
        .options(selectinload(Comment.author))
    )
    return result.scalar_one()


async def delete_comment(
    session: AsyncSession,
    comment: Comment,
) -> None:
    await session.delete(comment)
    await session.commit()
