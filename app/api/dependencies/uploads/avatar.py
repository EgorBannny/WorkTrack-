from io import BytesIO
from typing import Annotated

from fastapi import File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config.main_config import settings


class ValidatedAvatar:
    def __init__(self, content: bytes, ext: str):
        self.content = content
        self.ext = ext


async def validate_avatar(
    file: Annotated[UploadFile, File()],
) -> ValidatedAvatar:
    cfg = settings.uploads.avatar
    content = await file.read()

    if len(content) > cfg.max_file_size:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "File size exceeds the maximum allowed limit",
        )

    try:
        image = Image.open(BytesIO(content))
        image.verify()
    except UnidentifiedImageError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is not a valid image")

    image = Image.open(BytesIO(content))

    if image.format.lower() not in cfg.allowed_types:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Only {', '.join(cfg.allowed_types)} formats are allowed",
        )

    w, h = image.size
    if w != h:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Avatar must be square")

    return ValidatedAvatar(content=content, ext=image.format.lower())
