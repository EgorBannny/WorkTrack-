__all__ = (
    "projects_router",
    "tasks_router",
    "comments_router",
)

from .projects import projects_router
from .tasks import tasks_router
from .comments import comments_router
