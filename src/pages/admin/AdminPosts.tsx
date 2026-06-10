import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../lib/api';
import type { PostListItem } from '../../types/blog';

export function AdminPosts() {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listPosts()
      .then(setPosts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(post: PostListItem) {
    const confirmed = window.confirm(`Delete "${post.title}"?`);
    if (!confirmed) return;

    await adminApi.deletePost(post.id);
    setPosts((current) => current.filter((item) => item.id !== post.id));
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-stack-md border-b border-outline-variant pb-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-primary">Posts</h1>
          <p className="font-body-md text-secondary mt-2">Create, edit, publish, and archive blog posts.</p>
        </div>
        <Link to="/admin/posts/new" className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-3 font-label-caps rounded-sm">
          <Plus className="w-4 h-4" />
          New
        </Link>
      </div>

      {loading && <p className="font-body-md text-secondary">Loading posts...</p>}
      {error && <p className="font-body-md text-secondary">API error: {error}</p>}

      {!loading && !error && (
        <div className="border border-outline-variant rounded-sm overflow-hidden bg-surface-container-lowest">
          {posts.length === 0 ? (
            <div className="p-stack-md">
              <p className="font-body-md text-secondary">No posts yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {posts.map((post) => (
                <article key={post.id} className="p-stack-md flex flex-col md:flex-row md:items-center justify-between gap-stack-md">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-label-caps text-secondary border border-outline-variant px-2 py-1 rounded-sm">{post.status}</span>
                      {post.is_featured && <span className="font-label-caps text-primary border border-primary px-2 py-1 rounded-sm">Editor's pick</span>}
                      {post.is_popular && <span className="font-label-caps text-primary border border-primary px-2 py-1 rounded-sm">Popular</span>}
                      <span className="font-code-sm text-secondary">/{post.slug}</span>
                    </div>
                    <h2 className="font-headline-sm text-primary">{post.title}</h2>
                    {post.excerpt && <p className="font-body-md text-secondary mt-1 line-clamp-2">{post.excerpt}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/posts/${post.id}/edit`} className="p-2 border border-outline-variant rounded-sm hover:bg-surface-variant" aria-label="Edit post">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(post)} className="p-2 border border-outline-variant rounded-sm hover:bg-surface-variant" aria-label="Delete post">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
