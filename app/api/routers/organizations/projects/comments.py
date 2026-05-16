from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.crud.comments import (
    get_task_comments,
    create_comment,
    update_comment,
    delete_comment,
)

from app.api.dependencies.authentication import auth_guard
from app.api.dependencies.organizations import get_current_user_organization
from app.api.dependencies.projects import get_current_user_project
from app.api.dependencies.tasks import get_task_or_404
from app.api.dependencies.comments import get_comment_or_404
from app.core.models import (
    db_helper,
    User,
    UserOrganization,
    UserProject,
    Comment,
    Task,
)
from app.core.schemas import CommentRead, CommentCreate, CommentUpdate
from app.enums import OrgRole, ROLE_HIERARCHY
from app.core.config import settings

comments_router = APIRouter(tags=[settings.api.tags.comments])


@comments_router.get(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/comments",
    response_model=list[CommentRead],
    status_code=status.HTTP_200_OK,
)
async def get_comments(
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await get_task_comments(session, task.id)


@comments_router.post(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_task_comment(
    data: CommentCreate,
    current_user: Annotated[User, auth_guard],
    _: Annotated[UserProject, Depends(get_current_user_project)],
    task: Annotated[Task, Depends(get_task_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    return await create_comment(session, task.id, current_user.id, data.content)


@comments_router.patch(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/comments/{comment_id}",
    response_model=CommentRead,
    status_code=status.HTTP_200_OK,
)
async def update_task_comment(
    data: CommentUpdate,
    current_user: Annotated[User, auth_guard],
    comment: Annotated[Comment, Depends(get_comment_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    if comment.author_id != current_user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You can only edit your own comments"
        )
    return await update_comment(session, comment, data.content)


@comments_router.delete(
    "/{org_id}/projects/{project_id}/tasks/{task_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_task_comment(
    current_user: Annotated[User, auth_guard],
    uo: Annotated[UserOrganization, Depends(get_current_user_organization)],
    comment: Annotated[Comment, Depends(get_comment_or_404)],
    session: Annotated[AsyncSession, Depends(db_helper.session_getter)],
):
    is_author = comment.author_id == current_user.id
    is_manager_plus = ROLE_HIERARCHY[uo.role] >= ROLE_HIERARCHY[OrgRole.manager]
    if not is_author and not is_manager_plus:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")
    await delete_comment(session, comment)
