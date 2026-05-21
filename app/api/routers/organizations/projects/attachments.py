import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import filetype

from app.api.crud.attachments import (
    get_task_attachments,
    create_attachment,
    delete_attachment,
)
from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import get_current_user_organization
from app.api.dependencies.projects import get_current_user_project
from app.api.dependencies.tasks import get_task_or_404
from app.api.dependencies.attachments import get_attachment_or_404
from app.core.config import settings
from app.core.models import (
    db_helper,
    User,
    UserOrganization,
    UserProject,
    Task,
    Attachment,
)

from app.core.schemas import AttachmentRead
from app.enums import OrgRole, ROLE_HIERARCHY

attachments_router = APIRouter(tags=[settings.api.tags.attachments])


@attachments_router.get(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/attachments",
    response_model=list[AttachmentRead],
    status_code=status.HTTP_200_OK,
)
async def get_attachments(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):

    return await get_task_attachments(session, task.id)


@attachments_router.post(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/attachments",
    response_model=AttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_attachment(
    org_id: uuid.UUID,
    project_id: uuid.UUID,
    file: UploadFile,
    current_user: Annotated[User, auth_guard],
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    content = await file.read()

    if len(content) > settings.uploads.attachment.max_file_size:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large")

    kind = filetype.guess(content)
    if kind is None or kind.mime not in settings.uploads.attachment.allowed_mime_types:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File type not allowed")

    attachment = await create_attachment(
        session,
        task_id=task.id,
        uploaded_by=current_user.id,
        filename=file.filename,
        mime_type=kind.mime,
        file_size=len(content),
    )

    file_path = settings.uploads.attachment_path(
        org_id, project_id, task.id, attachment.id
    )
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    return attachment


@attachments_router.get(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/attachments/{attachment_id}/download",
)
async def download_attachment(
    org_id: uuid.UUID,
    project_id: uuid.UUID,
    _: Annotated[UserProject, Depends(get_current_user_project)],
    attachment: Annotated[Attachment, Depends(get_attachment_or_404)],
):
    file_path = settings.uploads.attachment_path(
        org_id, project_id, attachment.task_id, attachment.id
    )
    if not file_path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found on disk")
    return FileResponse(
        path=file_path,
        filename=attachment.filename,
        media_type=attachment.mime_type,
    )


@attachments_router.delete(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_attachment(
    org_id: uuid.UUID,
    project_id: uuid.UUID,
    current_user: Annotated[User, auth_guard],
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    attachment: Annotated[Attachment, Depends(get_attachment_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    is_author = attachment.uploaded_by == current_user.id
    is_manager_plus = ROLE_HIERARCHY[uo.role] >= ROLE_HIERARCHY[OrgRole.manager]
    if not is_author and not is_manager_plus:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")

    file_path = settings.uploads.attachment_path(
        org_id, project_id, attachment.task_id, attachment.id
    )
    await delete_attachment(session, attachment)
    if file_path.exists():
        file_path.unlink()
