import uvicorn
from fastapi import FastAPI
from app.core.config import settings
from app.api import api_router
from contextlib import asynccontextmanager
from app.core import db_helper


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await db_helper.dispose()


main_app = FastAPI(lifespan=lifespan)
main_app.include_router(
    router=api_router,
)

if __name__ == "__main__":
    uvicorn.run(
        app=settings.run.app,
        host=settings.run.host,
        port=settings.run.port,
        reload=settings.run.reload,
    )
