from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models import PostStatus


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: str | None = None


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=1, max_length=140)
    description: str | None = None


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=1, max_length=140)


class MediaAssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_filename: str
    content_type: str
    url: str
    size_bytes: int
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PostBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    slug: str = Field(min_length=1, max_length=260)
    excerpt: str | None = None
    cover_image_url: str | None = None
    status: PostStatus = PostStatus.draft
    content_json: dict[str, Any] = Field(default_factory=dict)
    content_html: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    category_id: str | None = None
    is_featured: bool = False
    is_popular: bool = False
    display_order: int = 0
    tag_ids: list[str] = Field(default_factory=list)
    published_at: datetime | None = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    slug: str | None = Field(default=None, min_length=1, max_length=260)
    excerpt: str | None = None
    cover_image_url: str | None = None
    status: PostStatus | None = None
    content_json: dict[str, Any] | None = None
    content_html: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    category_id: str | None = None
    is_featured: bool | None = None
    is_popular: bool | None = None
    display_order: int | None = None
    tag_ids: list[str] | None = None
    published_at: datetime | None = None


class PostRead(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: CategoryRead | None = None
    tags: list[TagRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class PostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    excerpt: str | None = None
    cover_image_url: str | None = None
    status: PostStatus
    is_featured: bool = False
    is_popular: bool = False
    display_order: int = 0
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    category: CategoryRead | None = None
    tags: list[TagRead] = Field(default_factory=list)
