import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Wrench } from 'lucide-react';
import { blogApi } from '../lib/api';
import { formatDate } from '../lib/date';
import type { Category, PostListItem } from '../types/blog';

export function Home() {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([blogApi.listPosts({ limit: 24 }), blogApi.listCategories()])
      .then(([nextPosts, nextCategories]) => {
        setPosts(nextPosts);
        setCategories(nextCategories);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const featured = posts.find((post) => post.is_featured) ?? posts[0];
  const latest = posts.filter((post) => post.id !== featured?.id).slice(0, 8);
  const popular = posts.filter((post) => post.is_popular).slice(0, 5);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-section-gap">
      {error && <p className="font-body-md text-secondary mb-stack-md">Unable to load posts: {error}</p>}
      {loading && <p className="font-body-md text-secondary">Loading articles...</p>}
      {!loading && !error && posts.length === 0 && (
        <div className="border border-outline-variant rounded-sm bg-surface-container-lowest p-stack-md">
          <h1 className="font-headline-md text-primary">No published articles yet</h1>
          <p className="font-body-md text-secondary mt-2">Publish a post from the admin workspace to populate the site.</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
      <div className="flex flex-col md:flex-row gap-gutter">
        <aside className="w-full md:w-1/4 flex flex-col gap-stack-md">
          <div className="border-t border-outline-variant pt-unit mb-stack-sm">
            <h2 className="font-label-caps text-secondary">Editor's Pick</h2>
          </div>
          {featured && <ArticleCard post={featured} featured />}
        </aside>

        <section className="w-full md:w-2/4 flex flex-col">
          <div className="border-t border-outline-variant pt-unit mb-stack-lg">
            <h2 className="font-label-caps text-secondary">Latest Articles</h2>
          </div>
          <div className="flex flex-col gap-stack-lg">
            {latest.map((post) => (
              <div key={post.id}>
                <LatestArticleRow post={post} />
              </div>
            ))}
          </div>
        </section>

        <aside className="w-full md:w-1/4 flex flex-col gap-stack-lg">
          <div>
            <div className="border-t border-outline-variant pt-unit mb-stack-sm">
              <h2 className="font-label-caps text-secondary">Popular Notes</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {(popular.length ? popular : posts.slice(0, 3)).map((post) => (
                <li key={post.id}>
                  <Link to={`/article/${post.slug}`} className="flex items-start gap-2 group">
                    <FileText className="text-secondary w-4 h-4 mt-1" />
                    <span className="font-body-md text-primary group-hover:text-secondary">{post.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="border-t border-outline-variant pt-unit mb-stack-sm">
              <h2 className="font-label-caps text-secondary">Topics</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((topic) => (
                <Link key={topic.id} to={`/category/${topic.slug}`} className="px-2 py-1 border border-outline-variant text-secondary font-label-caps hover:bg-surface-variant">
                  {topic.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-surface-container-low p-4 border border-outline-variant rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="text-primary w-4 h-4" />
              <h4 className="font-body-md font-semibold text-primary">Currently Building</h4>
            </div>
            <p className="font-code-sm text-secondary">A custom FastAPI and Tiptap publishing system.</p>
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}

function ArticleCard({ post, featured = false }: { post: PostListItem; featured?: boolean }) {
  return (
    <article className="group">
      <Link to={`/article/${post.slug}`}>
        <div className="aspect-[4/3] bg-surface-variant mb-stack-sm overflow-hidden rounded relative">
          {post.cover_image_url && <img src={post.cover_image_url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />}
          <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 backdrop-blur-sm border border-outline-variant">
            <span className="font-label-caps text-primary">{post.category?.name ?? 'Article'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-code-sm text-secondary">{formatDate(post.published_at)}</span>
        </div>
        <h3 className={`${featured ? 'font-headline-sm' : 'font-headline-md'} text-primary mb-2 group-hover:text-secondary transition-colors`}>{post.title}</h3>
        {post.excerpt && <p className="font-body-md text-secondary line-clamp-3">{post.excerpt}</p>}
      </Link>
    </article>
  );
}

function LatestArticleRow({ post }: { post: PostListItem }) {
  return (
    <article className="group border-b border-outline-variant pb-stack-md last:border-0">
      <Link to={`/article/${post.slug}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-label-caps text-secondary border border-outline-variant px-2 py-0.5 rounded-sm">{post.category?.name ?? 'Article'}</span>
          <span className="font-code-sm text-secondary ml-2">{formatDate(post.published_at)}</span>
        </div>
        <h3 className="font-headline-md text-primary mb-2 group-hover:text-secondary transition-colors">{post.title}</h3>
        {post.excerpt && <p className="font-body-md text-secondary mb-4 line-clamp-2">{post.excerpt}</p>}
        <div className="flex items-center text-primary font-label-caps group-hover:underline underline-offset-4">
          Read Article <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </Link>
    </article>
  );
}
