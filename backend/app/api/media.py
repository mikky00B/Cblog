from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models import MediaAsset, User
from app.schemas import MediaAssetRead

router = APIRouter(prefix="/admin/media")

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


@router.get("", response_model=list[MediaAssetRead])
def list_media(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[MediaAsset]:
    return list(db.scalars(select(MediaAsset).order_by(MediaAsset.created_at.desc())))


@router.post("", response_model=MediaAssetRead, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MediaAsset:
    settings = get_settings()
    suffix = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if suffix is None:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are supported")

    data = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Upload exceeds {settings.max_upload_mb} MB")

    upload_dir = Path(settings.media_local_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4()}{suffix}"
    path = upload_dir / filename
    path.write_bytes(data)

    asset = MediaAsset(
        filename=filename,
        original_filename=file.filename or filename,
        content_type=file.content_type or "application/octet-stream",
        url=f"{settings.media_public_base_url.rstrip('/')}/{filename}",
        size_bytes=len(data),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
