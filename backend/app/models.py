import enum
from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PostStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(120), default="Admin")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    posts: Mapped[list["Post"]] = relationship(back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    posts: Mapped[list["Post"]] = relationship(secondary="post_tags", back_populates="tags")


class PostTag(Base):
    __tablename__ = "post_tags"

    post_id: Mapped[str] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[str] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(240))
    slug: Mapped[str] = mapped_column(String(260), unique=True, index=True)
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.draft, index=True)
    content_json: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    content_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(260), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    author_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_featured: Mapped[bool] = mapped_column(default=False, index=True)
    is_popular: Mapped[bool] = mapped_column(default=False, index=True)
    display_order: Mapped[int] = mapped_column(default=0, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    category: Mapped[Category | None] = relationship(back_populates="posts")
    author: Mapped[User | None] = relationship()
    tags: Mapped[list[Tag]] = relationship(secondary="post_tags", back_populates="posts")


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    filename: Mapped[str] = mapped_column(String(255))
    original_filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(Text)
    size_bytes: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
