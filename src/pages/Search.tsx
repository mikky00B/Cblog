import { Search as SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../lib/api';
import { formatDate } from '../lib/date';
import type { PostListItem } from '../types/blog';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      blogApi
        .searchPosts(query)
        .then(setResults)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredFallback = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return results;
    return results.filter((post) => `${post.title} ${post.excerpt ?? ''} ${post.category?.name ?? ''}`.toLowerCase().includes(term));
  }, [query, results]);

  return (
    <div className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="max-w-3xl mx-auto mb-stack-lg">
        <div className="relative w-full mb-stack-sm">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-6 h-6" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-on-surface-variant text-headline-sm font-headline-sm pl-12 py-4 text-on-background placeholder-on-surface-variant outline-none"
            placeholder="Search the archive..."
          />
        </div>
        <p className="font-body-md text-on-surface-variant mt-stack-md">
          {loading ? 'Loading results...' : `${filteredFallback.length} results`} {query && <>for <span className="font-bold text-on-background">{query}</span></>}
        </p>
      </div>

      {error && <p className="max-w-3xl mx-auto font-body-md text-secondary mb-stack-md">Unable to search posts: {error}</p>}

      <div className="max-w-3xl mx-auto flex flex-col gap-0 border-t border-outline-variant/50">
        {!loading && !error && filteredFallback.length === 0 && (
          <div className="py-stack-md">
            <h2 className="font-headline-sm text-primary">No results</h2>
            <p className="font-body-md text-on-surface-variant mt-2">Try another search term or publish matching content from the admin workspace.</p>
          </div>
        )}
        {filteredFallback.map((post) => (
          <Link key={post.id} to={`/article/${post.slug}`} className="py-stack-md border-b border-outline-variant/30 group hover:bg-surface-container-low transition-colors -mx-margin-mobile md:-mx-8 px-margin-mobile md:px-8">
            <div className="flex items-center gap-4 mb-3">
              <span className="font-label-caps text-on-surface-variant tracking-wider">{post.category?.name ?? 'Article'}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <time className="font-code-sm text-on-surface-variant">{formatDate(post.published_at)}</time>
            </div>
            <h3 className="font-headline-sm text-on-background mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
            {post.excerpt && <p className="font-body-md text-on-surface-variant line-clamp-2">{post.excerpt}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
