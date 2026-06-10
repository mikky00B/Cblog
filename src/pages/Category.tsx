import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../lib/api';
import { formatDate } from '../lib/date';
import type { Category as CategoryType, PostListItem } from '../types/blog';

export function Category({ forcedSlug }: { forcedSlug?: string }) {
  const { slug: routeSlug } = useParams();
  const slug = forcedSlug ?? routeSlug ?? 'backend';
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [latest, setLatest] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([blogApi.listPosts({ category: slug, limit: 50 }), blogApi.listPosts({ limit: 4 }), blogApi.listCategories()])
      .then(([categoryPosts, latestPosts, nextCategories]) => {
        setPosts(categoryPosts);
        setLatest(latestPosts);
        setCategories(nextCategories);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const filtered = useMemo(() => {
    return posts.filter((post) => post.category?.slug === slug);
  }, [posts, slug]);

  const category = categories.find((item) => item.slug === slug);
  const title = category?.name ?? filtered[0]?.category?.name ?? slug.replace(/-/g, ' ');

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="mb-section-gap">
        <h1 className="font-display-lg-mobile md:font-display-lg text-primary mb-stack-sm capitalize">{title}</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl mb-stack-lg">
          Practical notes from the archive, grouped by editorial category.
        </p>
        <div className="flex flex-wrap gap-stack-sm">
          {categories.map((topic) => (
            <Link key={topic.id} to={`/category/${topic.slug}`} className="px-3 py-1.5 border border-outline-variant rounded-full font-label-caps text-on-surface-variant hover:border-primary hover:text-primary">
              {topic.name}
            </Link>
          ))}
        </div>
      </div>

      {error && <p className="font-body-md text-secondary mb-stack-md">Unable to load category: {error}</p>}
      {loading && <p className="font-body-md text-secondary">Loading articles...</p>}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-8 flex flex-col gap-stack-lg">
          {!loading && !error && filtered.length === 0 && (
            <div className="border border-outline-variant rounded-sm bg-surface-container-lowest p-stack-md">
              <h2 className="font-headline-sm text-primary">No published articles</h2>
              <p className="font-body-md text-on-surface-variant mt-2">Publish a post in this category from the admin workspace.</p>
            </div>
          )}

          {filtered.map((post) => (
            <Link key={post.id} to={`/article/${post.slug}`} className="group">
              <article>
                <div className="flex items-center gap-2 mb-unit">
                  <span className="font-label-caps text-on-surface-variant">{post.category?.name ?? 'Article'}</span>
                </div>
                <h2 className="font-headline-md text-primary mb-stack-sm group-hover:underline decoration-1 underline-offset-4">{post.title}</h2>
                {post.excerpt && <p className="font-body-md text-on-surface-variant mb-stack-sm line-clamp-2">{post.excerpt}</p>}
                <div className="flex items-center gap-stack-sm font-label-caps text-outline">
                  <span>{formatDate(post.published_at)}</span>
                </div>
                <hr className="mt-stack-md border-t border-outline-variant w-1/3" />
              </article>
            </Link>
          ))}
        </div>

        <aside className="md:col-span-4 md:col-start-9 flex flex-col gap-stack-lg">
          <div>
            <h3 className="font-label-caps text-primary border-b border-outline-variant pb-2 mb-stack-sm">Latest</h3>
            <ul className="flex flex-col gap-unit mt-stack-sm">
              {latest.map((post) => (
                <li key={post.id}>
                  <Link to={`/article/${post.slug}`} className="font-body-md text-on-surface-variant hover:text-primary transition-colors py-1 block">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
