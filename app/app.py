from fastapi import FastAPI
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
