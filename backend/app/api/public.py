from html import escape

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.db.session import get_db
from app.models import Category, Post, PostStatus
from app.schemas import CategoryRead, PostListItem, PostRead

router = APIRouter()


@router.get("/posts", response_model=list[PostListItem])
def list_posts(
    category: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Post]:
    stmt = (
        select(Post)
        .options(selectinload(Post.category))
        .options(selectinload(Post.tags))
        .where(Post.status == PostStatus.published)
        .order_by(Post.display_order.desc(), Post.published_at.desc().nullslast(), Post.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if category:
        stmt = stmt.join(Post.category).where(Category.slug == category)
    return list(db.scalars(stmt))


@router.get("/posts/{slug}", response_model=PostRead)
def get_post(slug: str, db: Session = Depends(get_db)) -> Post:
    post = db.scalar(
        select(Post)
        .options(selectinload(Post.category))
        .options(selectinload(Post.tags))
        .where(Post.slug == slug, Post.status == PostStatus.published)
    )
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name.asc())))


@router.get("/search", response_model=list[PostListItem])
def search_posts(
    q: str = Query(default="", max_length=120),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Post]:
    term = f"%{q.strip()}%"
    stmt = (
        select(Post)
        .options(selectinload(Post.category), selectinload(Post.tags))
        .where(Post.status == PostStatus.published)
        .order_by(Post.display_order.desc(), Post.published_at.desc().nullslast(), Post.created_at.desc())
        .limit(limit)
    )
    if q.strip():
        stmt = stmt.where(or_(Post.title.ilike(term), Post.excerpt.ilike(term), Post.content_html.ilike(term)))
    return list(db.scalars(stmt))


@router.get("/rss.xml")
def rss_feed(db: Session = Depends(get_db)) -> Response:
    settings = get_settings()
    posts = db.scalars(
        select(Post)
        .where(Post.status == PostStatus.published)
        .order_by(Post.published_at.desc().nullslast(), Post.created_at.desc())
        .limit(50)
    )
    items = []
    site_url = str(settings.site_url).rstrip("/")
    for post in posts:
        url = f"{site_url}/article/{post.slug}"
        pub_date = (post.published_at or post.created_at).strftime("%a, %d %b %Y %H:%M:%S %z")
        items.append(
            f"<item><title>{escape(post.title)}</title><link>{escape(url)}</link>"
            f"<guid>{escape(url)}</guid><pubDate>{pub_date}</pubDate>"
            f"<description>{escape(post.excerpt or '')}</description></item>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<rss version="2.0"><channel>'
        f"<title>{escape(settings.app_name)}</title><link>{escape(site_url)}</link>"
        f"<description>{escape(settings.app_name)} articles</description>"
        f"{''.join(items)}</channel></rss>"
    )
    return Response(content=xml, media_type="application/rss+xml")


@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)) -> Response:
    settings = get_settings()
    site_url = str(settings.site_url).rstrip("/")
    posts = db.scalars(select(Post.slug).where(Post.status == PostStatus.published))
    urls = [f"<url><loc>{escape(site_url)}</loc></url>"]
    urls.extend(f"<url><loc>{escape(site_url)}/article/{escape(slug)}</loc></url>" for slug in posts)
    xml = '<?xml version="1.0" encoding="UTF-8"?>' f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{"".join(urls)}</urlset>'
    return Response(content=xml, media_type="application/xml")
