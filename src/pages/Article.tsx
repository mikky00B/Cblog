import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../lib/api';
import { formatDate } from '../lib/date';
import type { Post, PostListItem } from '../types/blog';

export function Article() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    blogApi
      .getPost(slug)
      .then((nextPost) => {
        setPost(nextPost);
        return blogApi.listPosts({ category: nextPost.category?.slug, limit: 6 }).then((items) => {
          setRelated(items.filter((item) => item.slug !== nextPost.slug).slice(0, 2));
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    document.title = post.seo_title || post.title;
    const description = post.seo_description || post.excerpt || '';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [post]);

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <p className="font-body-md text-secondary">Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        <h1 className="font-headline-md text-primary">Article unavailable</h1>
        <p className="font-body-md text-secondary mt-2">{error ?? 'The requested article could not be found.'}</p>
        <Link to="/" className="inline-flex mt-stack-md font-label-caps text-primary underline underline-offset-4">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 lg:grid-cols-12 gap-gutter">
      <aside className="hidden lg:col-span-3 lg:block">
        <nav className="sticky top-stack-lg h-fit bg-transparent hidden lg:flex flex-col gap-stack-sm w-64">
          <div className="mb-stack-md">
            <h3 className="font-headline-sm text-primary">Table of Contents</h3>
            <p className="font-body-md text-on-surface-variant">In this article</p>
          </div>
          <a href="#article-body" className="font-label-caps text-primary border-l-2 border-primary pl-4">
            Article
          </a>
        </nav>
      </aside>

      <article className="col-span-1 lg:col-span-6">
        <header className="mb-stack-lg border-b border-outline-variant pb-stack-md">
          <span className="font-label-caps text-on-surface-variant mb-unit block">{post.category?.name ?? 'Article'}</span>
          <h1 className="font-display-lg-mobile md:font-display-lg text-primary mb-stack-md">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 font-body-md text-on-surface-variant">
            <span>{formatDate(post.published_at)}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-primary font-bold">Mike Cleverson</span>
          </div>
          {post.cover_image_url && <img src={post.cover_image_url} alt="" className="mt-stack-md w-full aspect-video object-cover border border-outline-variant rounded-sm" />}
        </header>

        <div
          id="article-body"
          className="ArticleContent font-body-lg text-on-surface"
          dangerouslySetInnerHTML={{ __html: post.content_html || '' }}
        />
      </article>

      <aside className="col-span-1 lg:col-span-3 lg:pl-gutter border-t border-outline-variant pt-stack-md lg:border-t-0 lg:pt-0 lg:border-l">
        <div className="mb-stack-lg">
          <h4 className="font-label-caps text-on-surface-variant mb-stack-sm">Topic Tags</h4>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag.id} className="font-label-caps px-3 py-1 border border-outline-variant rounded-full text-on-surface">
                {tag.name}
              </span>
            ))}
            {post.tags.length === 0 && <span className="font-body-md text-on-surface-variant">No tags assigned.</span>}
          </div>
        </div>

        <div>
          <h4 className="font-label-caps text-on-surface-variant mb-stack-sm">Related Articles</h4>
          <div className="space-y-stack-md">
            {related.map((item) => (
              <Link key={item.id} to={`/article/${item.slug}`} className="block group">
                <h5 className="font-headline-sm text-primary group-hover:underline">{item.title}</h5>
                {item.excerpt && <p className="font-body-md text-on-surface-variant mt-unit line-clamp-2">{item.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
