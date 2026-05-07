from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__name__).parent.parent.parent.parent


class AvatarConfig(BaseModel):
    allowed_types: set[str] = {"image/jpeg", "image/png", "image/webp"}
    max_file_size: int = 5 * 1024 * 102
    min_resolution: int = 100
    max_resolution: int = 500


class UploadsConfig(BaseModel):
    base_dir: Path = BASE_DIR / "uploads"
    avatar: AvatarConfig = AvatarConfig()

    @property
    def avatars_dir(self) -> Path:
        return self.base_dir / "avatars"
