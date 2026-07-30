"""Validated avatar files stored on the backend's persistent upload volume."""
from io import BytesIO
from pathlib import Path
from uuid import uuid4
import re
import warnings

from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import config

MAX_AVATAR_BYTES = 2 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}


def save_avatar(content: bytes, content_type: str) -> tuple[Path, str]:
    if not content or len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(422, "Choose an image no larger than 2 MB")
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(422, "Choose a JPEG, PNG, or WebP image")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as original:
                if original.format != ALLOWED_TYPES[content_type]:
                    raise ValueError("Image type does not match file contents")
                if original.width * original.height > 16_000_000:
                    raise ValueError("Image must be at most 16 megapixels")
                original.load()
                normalized = ImageOps.exif_transpose(original).convert("RGBA")
                normalized.thumbnail((1024, 1024))
                encoded = BytesIO()
                normalized.save(encoded, format="WEBP", quality=85)
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(422, "Invalid image. Use a JPEG, PNG, or WebP of at most 16 megapixels") from exc

    directory = Path(config.AVATAR_STORAGE_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}.webp"
    destination = directory / filename
    try:
        with destination.open("xb") as target:
            target.write(encoded.getvalue())
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return destination, f"{config.PUBLIC_BACKEND_URL}/api/auth/avatars/{filename}"


def avatar_path(filename: str) -> Path:
    if not re.fullmatch(r"[0-9a-f]{32}\.webp", filename):
        raise HTTPException(404, "Avatar not found")
    path = Path(config.AVATAR_STORAGE_DIR) / filename
    if not path.is_file():
        raise HTTPException(404, "Avatar not found")
    return path
