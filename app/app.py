from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from contextlib import asynccontextmanager
from app.core.models import db_helper, redis_helper
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await db_helper.dispose()
    await redis_helper.dispose()


main_app = FastAPI(
    title="WorkTrack",
    description="внутренний корпоративный портал для управления задачами и проектами",
    version="1.0",
    lifespan=lifespan,
)
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.allowed_origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)
main_app.include_router(
    router=api_router,
)
