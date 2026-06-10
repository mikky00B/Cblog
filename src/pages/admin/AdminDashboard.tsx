import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Edit3, FileText, Image, Layers3, Plus, Tag, Upload } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { formatDate } from '../../lib/date';
import type { Category, MediaAsset, PostListItem, Tag as BlogTag } from '../../types/blog';

export function AdminDashboard() {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.listPosts(), adminApi.listCategories(), adminApi.listTags(), adminApi.listMedia()])
      .then(([nextPosts, nextCategories, nextTags, nextMedia]) => {
        setPosts(nextPosts);
        setCategories(nextCategories);
        setTags(nextTags);
        setMedia(nextMedia);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      drafts: posts.filter((post) => post.status === 'draft').length,
      published: posts.filter((post) => post.status === 'published').length,
      archived: posts.filter((post) => post.status === 'archived').length,
      uncategorized: posts.filter((post) => !post.category).length,
      featured: posts.filter((post) => post.is_featured).length,
      popular: posts.filter((post) => post.is_popular).length,
    }),
    [posts],
  );

  const recentPosts = posts.slice(0, 5);

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md border-b border-outline-variant pb-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-primary">Publishing Workspace</h1>
          <p className="font-body-md text-secondary mt-2">Track content status, metadata coverage, and recent editorial activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/media" className="inline-flex items-center gap-2 border border-outline-variant px-4 py-3 font-label-caps rounded-sm">
            <Image className="w-4 h-4" />
            Media
          </Link>
          <Link to="/admin/posts/new" className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-3 font-label-caps rounded-sm">
            <Plus className="w-4 h-4" />
            New post
          </Link>
        </div>
      </div>

      {error && <p className="font-body-md text-secondary mb-stack-md">API error: {error}</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-stack-md mb-stack-lg">
        <MetricCard title="Published" value={counts.published} detail={`${posts.length} total posts`} icon={<Upload className="w-5 h-5" />} loading={loading} />
        <MetricCard title="Drafts" value={counts.drafts} detail="Waiting for review" icon={<Edit3 className="w-5 h-5" />} loading={loading} />
        <MetricCard title="Archived" value={counts.archived} detail="Hidden from public lists" icon={<Archive className="w-5 h-5" />} loading={loading} />
        <MetricCard title="Media" value={media.length} detail="Uploaded assets" icon={<Image className="w-5 h-5" />} loading={loading} />
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-gutter">
        <div className="border border-outline-variant rounded-sm bg-surface-container-lowest overflow-hidden">
          <div className="p-stack-md border-b border-outline-variant flex items-center justify-between gap-stack-md">
            <div>
              <h2 className="font-headline-sm text-primary">Recent Posts</h2>
              <p className="font-body-md text-secondary mt-1">Latest changes across drafts, published posts, and archived work.</p>
            </div>
            <Link to="/admin/posts" className="font-label-caps text-secondary hover:text-primary">
              All posts
            </Link>
          </div>

          {loading && <DashboardEmpty message="Loading editorial data..." />}

          {!loading && !error && recentPosts.length === 0 && (
            <div className="p-stack-md">
              <div className="border border-outline-variant rounded-sm p-stack-md bg-surface-container-low">
                <h3 className="font-headline-sm text-primary">No posts yet</h3>
                <p className="font-body-md text-secondary mt-2">Create the first article to populate the overview.</p>
                <Link to="/admin/posts/new" className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-3 font-label-caps rounded-sm mt-stack-md">
                  <Plus className="w-4 h-4" />
                  New post
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && recentPosts.length > 0 && (
            <div className="divide-y divide-outline-variant">
              {recentPosts.map((post) => (
                <article key={post.id} className="p-stack-md flex flex-col md:flex-row md:items-center justify-between gap-stack-md">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={post.status} />
                      {post.is_featured && <span className="font-label-caps text-primary border border-primary px-2 py-1 rounded-sm">Editor's pick</span>}
                      {post.is_popular && <span className="font-label-caps text-primary border border-primary px-2 py-1 rounded-sm">Popular</span>}
                      <span className="font-code-sm text-secondary truncate">/{post.slug}</span>
                      {post.category && <span className="font-label-caps text-secondary border border-outline-variant px-2 py-1 rounded-sm">{post.category.name}</span>}
                    </div>
                    <h3 className="font-headline-sm text-primary truncate">{post.title}</h3>
                    <p className="font-body-md text-secondary mt-1">Updated {formatDate(post.updated_at)}</p>
                  </div>
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 border border-outline-variant px-3 py-2 font-label-caps rounded-sm hover:bg-surface-variant"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-stack-md">
          <SummaryPanel title="Content Health" icon={<FileText className="w-5 h-5" />}>
            <SummaryRow label="Uncategorized" value={counts.uncategorized} loading={loading} />
            <SummaryRow label="Editor's picks" value={counts.featured} loading={loading} />
            <SummaryRow label="Popular notes" value={counts.popular} loading={loading} />
            <SummaryRow label="Categories" value={categories.length} loading={loading} />
            <SummaryRow label="Tags" value={tags.length} loading={loading} />
          </SummaryPanel>

          <SummaryPanel title="Quick Actions" icon={<Layers3 className="w-5 h-5" />}>
            <QuickLink to="/admin/posts/new" icon={<Plus className="w-4 h-4" />} label="Write post" />
            <QuickLink to="/admin/media" icon={<Image className="w-4 h-4" />} label="Upload media" />
            <QuickLink to="/admin/settings" icon={<Tag className="w-4 h-4" />} label="Manage taxonomy" />
          </SummaryPanel>

          <SummaryPanel title="Latest Media" icon={<Image className="w-5 h-5" />}>
            {loading && <p className="font-body-md text-secondary">Loading media...</p>}
            {!loading && media.length === 0 && <p className="font-body-md text-secondary">No media uploaded yet.</p>}
            {!loading && media.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {media.slice(0, 6).map((asset) => (
                  <img key={asset.id} src={asset.url} alt={asset.original_filename} className="aspect-square w-full object-cover border border-outline-variant rounded-sm bg-surface-variant" />
                ))}
              </div>
            )}
          </SummaryPanel>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({ title, value, detail, icon, loading }: { title: string; value: number; detail: string; icon: ReactNode; loading: boolean }) {
  return (
    <div className="border border-outline-variant rounded-sm p-stack-md bg-surface-container-lowest">
      <div className="flex items-start justify-between gap-stack-md">
        <div>
          <p className="font-label-caps text-secondary">{title}</p>
          <p className="font-headline-md text-primary mt-2">{loading ? '-' : value}</p>
        </div>
        <span className="p-2 border border-outline-variant rounded-sm text-primary">{icon}</span>
      </div>
      <p className="font-body-md text-secondary mt-2">{loading ? 'Loading...' : detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PostListItem['status'] }) {
  const label = status === 'published' ? 'Live' : status;
  return <span className="font-label-caps text-secondary border border-outline-variant px-2 py-1 rounded-sm">{label}</span>;
}

function SummaryPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="border border-outline-variant rounded-sm bg-surface-container-lowest p-stack-md">
      <div className="flex items-center gap-2 mb-stack-md">
        <span className="p-2 border border-outline-variant rounded-sm text-primary">{icon}</span>
        <h2 className="font-headline-sm text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-outline-variant py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="font-body-md text-secondary">{label}</span>
      <span className="font-label-caps text-primary">{loading ? '-' : value}</span>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 border-t border-outline-variant py-3 first:border-t-0 first:pt-0 last:pb-0 text-secondary hover:text-primary">
      <span className="font-label-caps">{label}</span>
      {icon}
    </Link>
  );
}

function DashboardEmpty({ message }: { message: string }) {
  return (
    <div className="p-stack-md">
      <p className="font-body-md text-secondary">{message}</p>
    </div>
  );
}
