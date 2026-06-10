import bleach
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Category, Post, Tag, User
from app.schemas import CategoryCreate, CategoryRead, PostCreate, PostListItem, PostRead, PostUpdate, TagCreate, TagRead

router = APIRouter(prefix="/admin")

ALLOWED_TAGS = [
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "strong",
    "ul",
]
ALLOWED_ATTRIBUTES = {"a": ["href", "title", "target", "rel"], "img": ["src", "alt", "title"]}


def sanitize_content_html(value: str | None) -> str | None:
    if value is None:
        return None
    return bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)


@router.get("/posts", response_model=list[PostListItem])
def list_admin_posts(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Post]:
    stmt = (
        select(Post)
        .options(selectinload(Post.category), selectinload(Post.tags))
        .order_by(Post.display_order.desc(), Post.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(stmt))


@router.post("/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Post:
    data = payload.model_dump(exclude={"tag_ids"})
    data["content_html"] = sanitize_content_html(data.get("content_html"))
    post = Post(**data, author_id=user.id)
    post.tags = list(db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids)))) if payload.tag_ids else []
    db.add(post)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Post slug already exists") from exc
    db.refresh(post)
    return post


@router.get("/posts/{post_id}", response_model=PostRead)
def get_admin_post(
    post_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Post:
    post = db.scalar(select(Post).options(selectinload(Post.category), selectinload(Post.tags)).where(Post.id == post_id))
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.patch("/posts/{post_id}", response_model=PostRead)
def update_post(
    post_id: str,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Post:
    post = db.scalar(select(Post).options(selectinload(Post.tags)).where(Post.id == post_id))
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    data = payload.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    if "content_html" in data:
        data["content_html"] = sanitize_content_html(data.get("content_html"))
    for key, value in data.items():
        setattr(post, key, value)
    if tag_ids is not None:
        post.tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids)))) if tag_ids else []

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Post slug already exists") from exc
    db.refresh(post)
    return post


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()


@router.get("/categories", response_model=list[CategoryRead])
def list_admin_categories(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name.asc())))


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Category:
    category = Category(**payload.model_dump())
    db.add(category)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category already exists") from exc
    db.refresh(category)
    return category


@router.get("/tags", response_model=list[TagRead])
def list_admin_tags(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Tag]:
    return list(db.scalars(select(Tag).order_by(Tag.name.asc())))


@router.post("/tags", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Tag:
    tag = Tag(**payload.model_dump())
    db.add(tag)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Tag already exists") from exc
    db.refresh(tag)
    return tag
