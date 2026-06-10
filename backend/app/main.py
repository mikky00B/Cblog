from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import admin, auth, media, public
from app.core.config import get_settings

settings = get_settings()
Path(settings.media_local_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.frontend_origin)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(media.router, prefix=settings.api_prefix)
app.mount("/uploads", StaticFiles(directory=settings.media_local_dir), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
