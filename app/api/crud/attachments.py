import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.models.task.attachment import Attachment


async def get_task_attachments(
    session: AsyncSession, task_id: uuid.UUID
) -> list[Attachment]:
    result = await session.execute(
        select(Attachment)
        .where(Attachment.task_id == task_id)
        .options(selectinload(Attachment.uploader))
        .order_by(Attachment.created_at.asc())
    )
    return list(result.scalars().all())


async def get_attachment_by_id(
    session: AsyncSession, attachment_id: uuid.UUID
) -> Attachment | None:
    result = await session.execute(
        select(Attachment)
        .where(Attachment.id == attachment_id)
        .options(selectinload(Attachment.uploader))
    )
    return result.scalar_one_or_none()


async def create_attachment(
    session: AsyncSession,
    task_id: uuid.UUID,
    uploaded_by: uuid.UUID,
    filename: str,
    mime_type: str,
    file_size: int,
) -> Attachment:
    attachment = Attachment(
        task_id=task_id,
        uploaded_by=uploaded_by,
        filename=filename,
        mime_type=mime_type,
        file_size=file_size,
    )
    session.add(attachment)
    await session.commit()
    await session.refresh(attachment, attribute_names=["uploader"])
    return attachment


async def delete_attachment(session: AsyncSession, attachment: Attachment) -> None:
    await session.delete(attachment)
    await session.commit()
