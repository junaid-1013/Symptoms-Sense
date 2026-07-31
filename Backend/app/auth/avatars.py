"""Validated avatar files stored on the backend's persistent upload volume."""
from io import BytesIO
from pathlib import Path
from uuid import uuid4
import re
import warnings
import logging
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import config

MAX_AVATAR_BYTES = 2 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}
logger = logging.getLogger(__name__)


def is_google_avatar_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname == "lh3.googleusercontent.com" and not parsed.username and not parsed.password


async def cache_google_avatar(url: str) -> tuple[Path, str] | None:
    """Keep Google's trusted profile picture on the existing persistent avatar store."""
    if not is_google_avatar_url(url):
        return None
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                content_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
                if content_type not in ALLOWED_TYPES:
                    return None
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > MAX_AVATAR_BYTES:
                        return None
        return save_avatar(bytes(content), content_type)
    except (httpx.HTTPError, HTTPException, OSError) as exc:
        logger.warning("Could not cache Google profile image: %s", type(exc).__name__)
        return None


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
