import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { blogApi } from '../lib/api';
import type { PostListItem } from '../types/blog';

export function NotFound() {
  const [posts, setPosts] = useState<PostListItem[]>([]);

  useEffect(() => {
    blogApi
      .listPosts({ limit: 2 })
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  return (
    <main className="flex-grow flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="max-w-[720px] w-full text-center flex flex-col items-center">
        <h1 className="font-display-lg-mobile md:font-display-lg text-on-surface mb-stack-md">404</h1>
        <p className="font-body-lg text-on-surface-variant max-w-md mx-auto mb-stack-lg">
          The article you are looking for has been moved or does not exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-stack-md justify-center w-full mb-section-gap">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-primary font-body-md rounded hover:bg-on-surface-variant transition-colors duration-200"
          >
            Return to Homepage
          </Link>
          <Link 
            to="/search" 
            className="inline-flex items-center justify-center px-6 py-3 bg-transparent border border-outline text-on-surface font-body-md rounded hover:border-on-surface-variant hover:text-on-surface transition-colors duration-200"
          >
            <Search className="w-5 h-5 mr-2" />
            Search the Archive
          </Link>
        </div>

        {posts.length > 0 && (
          <div className="w-full text-left">
            <h2 className="font-label-caps text-on-surface-variant mb-stack-md border-b-[0.5px] border-outline-variant pb-2">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              {posts.map((post) => (
                <Link key={post.id} to={`/article/${post.slug}`} className="group flex flex-col p-6 bg-surface-container-lowest rounded-lg border border-outline-variant hover:border-primary hover:bg-surface-bright transition-all duration-300">
                  <span className="font-label-caps text-on-surface-variant mb-3 group-hover:text-primary transition-colors">{post.category?.name ?? 'Article'}</span>
                  <h3 className="font-headline-sm text-on-surface mb-2">{post.title}</h3>
                  {post.excerpt && <p className="font-body-md text-on-surface-variant mt-auto">{post.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
