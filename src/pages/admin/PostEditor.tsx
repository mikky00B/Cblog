import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import {
  Archive,
  Bold,
  Code,
  Eraser,
  Eye,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Lock,
  Minus,
  Pilcrow,
  Pencil,
  Quote,
  Redo2,
  Save,
  Strikethrough,
  Undo2,
  Upload,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { slugify } from '../../lib/slug';
import type { Category, Post, PostPayload, PostStatus, Tag } from '../../types/blog';

const emptyDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
    },
  ],
};

export function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<PostStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [loadedPost, setLoadedPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      Typography,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: emptyDocument,
    onUpdate: () => setEditorVersion((current) => current + 1),
    editorProps: {
      attributes: {
        class: 'min-h-[520px] focus:outline-none font-body-lg text-on-surface ArticleContent',
      },
    },
  });

  useEffect(() => {
    Promise.all([adminApi.listCategories(), adminApi.listTags()])
      .then(([nextCategories, nextTags]) => {
        setCategories(nextCategories);
        setTags(nextTags);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (isNew || !id) return;

    adminApi
      .getPost(id)
      .then((post) => {
        setLoadedPost(post);
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt ?? '');
        setCoverImageUrl(post.cover_image_url ?? '');
        setCategoryId(post.category?.id ?? post.category_id ?? '');
        setSelectedTagIds(post.tags.map((tag) => tag.id));
        setStatus(post.status);
        setIsFeatured(post.is_featured);
        setIsPopular(post.is_popular);
        setDisplayOrder(post.display_order);
        setSeoTitle(post.seo_title ?? '');
        setSeoDescription(post.seo_description ?? '');
        editor?.commands.setContent(post.content_json ?? emptyDocument);
      })
      .catch((err: Error) => setError(err.message));
  }, [editor, id, isNew]);

  const plainText = useMemo(() => editor?.getText().trim() ?? '', [editor, editorVersion]);
  const wordCount = useMemo(() => (plainText ? plainText.split(/\s+/).length : 0), [plainText]);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const seoTitleLength = seoTitle.trim().length || title.trim().length;
  const seoDescriptionLength = seoDescription.trim().length || excerpt.trim().length;
  const slugIsValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
  const canSave = useMemo(() => title.trim().length > 0 && slug.trim().length > 0 && slugIsValid && editor, [editor, slug, slugIsValid, title]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!loadedPost && !slug) {
      setSlug(slugify(value));
    }
  }

  async function handleSave(nextStatus = status) {
    if (!editor || !canSave) return;

    setSaving(true);
    setError(null);

    const payload: PostPayload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      status: nextStatus,
      is_featured: isFeatured,
      is_popular: isPopular,
      display_order: displayOrder,
      content_json: editor.getJSON(),
      content_html: editor.getHTML(),
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      category_id: categoryId || null,
      tag_ids: selectedTagIds,
      published_at: nextStatus === 'published' ? loadedPost?.published_at ?? new Date().toISOString() : null,
    };

    try {
      const saved = isNew ? await adminApi.createPost(payload) : await adminApi.updatePost(id!, payload);
      setLoadedPost(saved);
      setStatus(saved.status);
      navigate(`/admin/posts/${saved.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(file: File) {
    const asset = await adminApi.uploadMedia(file);
    setCoverImageUrl(asset.url);
  }

  async function handleEditorImageUpload(file: File) {
    if (!editor) return;
    const asset = await adminApi.uploadMedia(file);
    editor.chain().focus().setImage({ src: asset.url, alt: asset.original_filename }).run();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => (current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]));
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md border-b border-outline-variant pb-stack-md mb-stack-lg">
        <div>
          <Link to="/admin/posts" className="font-label-caps text-secondary hover:text-primary">
            Posts
          </Link>
          <h1 className="font-headline-md text-primary mt-2">{isNew ? 'New Post' : 'Edit Post'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="inline-flex items-center gap-2 border border-outline-variant px-4 py-3 font-label-caps rounded-sm"
          >
            {showPreview ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Editor' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => void handleSave('draft')}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 border border-outline-variant px-4 py-3 font-label-caps rounded-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save draft
          </button>
          <button
            onClick={() => void handleSave('published')}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-3 font-label-caps rounded-sm disabled:opacity-50"
          >
            {saving ? <Save className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {saving ? 'Saving' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <p className="font-body-md text-secondary mb-stack-md">API error: {error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-gutter">
        <div className="space-y-stack-md">
          {showPreview ? (
            <article className="border border-outline-variant rounded-sm bg-surface-container-lowest p-stack-md">
              <h1 className="font-display-lg-mobile md:font-display-lg text-primary mb-stack-md">{title || 'Untitled post'}</h1>
              {coverImageUrl && <img src={coverImageUrl} alt="" className="w-full aspect-video object-cover border border-outline-variant rounded-sm mb-stack-md" />}
              <div className="ArticleContent font-body-lg text-on-surface" dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? '' }} />
            </article>
          ) : (
            <>
              <input
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Post title"
                className="w-full bg-transparent border-b border-outline-variant py-3 font-headline-md text-primary focus:outline-none focus:border-primary"
              />

              <div className="border border-outline-variant rounded-sm bg-surface-container-lowest">
                <EditorToolbar editor={editor} onImageUpload={handleEditorImageUpload} onError={setError} />
                <div className="p-stack-md max-w-none">
                  <EditorContent editor={editor} />
                </div>
                <div className="border-t border-outline-variant px-3 py-2 flex flex-wrap items-center justify-between gap-2 font-code-sm text-secondary">
                  <span>{wordCount} words</span>
                  <span>{readingMinutes} min read</span>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-stack-md">
          <Field label="Slug">
            <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className="AdminInput" />
            {!slugIsValid && slug.trim() && <FieldHint tone="warning">Use lowercase letters, numbers, and single hyphens.</FieldHint>}
          </Field>

          <Field label="Status">
            <div className="grid grid-cols-3 gap-2">
              <StatusButton active={status === 'draft'} icon={<Lock className="w-4 h-4" />} label="Draft" onClick={() => setStatus('draft')} />
              <StatusButton active={status === 'published'} icon={<Upload className="w-4 h-4" />} label="Live" onClick={() => setStatus('published')} />
              <StatusButton active={status === 'archived'} icon={<Archive className="w-4 h-4" />} label="Archive" onClick={() => setStatus('archived')} />
            </div>
          </Field>

          <Field label="Homepage placement">
            <div className="space-y-2">
              <ToggleRow label="Editor's pick" checked={isFeatured} onChange={setIsFeatured} />
              <ToggleRow label="Popular note" checked={isPopular} onChange={setIsPopular} />
            </div>
          </Field>

          <Field label="Display priority">
            <input
              type="number"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(Number(event.target.value) || 0)}
              className="AdminInput"
              min={0}
              step={1}
            />
            <FieldHint>Higher numbers appear first in featured and list sections.</FieldHint>
          </Field>

          <Field label="Category">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="AdminInput">
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`border border-outline-variant px-2 py-1 rounded-sm font-label-caps ${
                    selectedTagIds.includes(tag.id) ? 'bg-primary text-on-primary border-primary' : 'text-secondary'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && <span className="font-body-md text-secondary">Add tags in Settings.</span>}
            </div>
          </Field>

          <Field label="Cover image">
            <input value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} className="AdminInput mb-2" placeholder="https://..." />
            <label className="inline-flex items-center gap-2 border border-outline-variant px-3 py-2 font-label-caps rounded-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleCoverUpload(file).catch((err: Error) => setError(err.message));
                }}
              />
            </label>
            {coverImageUrl && <img src={coverImageUrl} alt="" className="mt-2 w-full aspect-video object-cover border border-outline-variant rounded-sm" />}
          </Field>

          <Field label="Excerpt">
            <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={4} className="AdminInput" />
            <FieldHint>{excerpt.trim().length}/180 characters</FieldHint>
          </Field>

          <Field label="SEO title">
            <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className="AdminInput" />
            <FieldHint tone={seoTitleLength > 60 ? 'warning' : 'default'}>{seoTitleLength}/60 recommended characters</FieldHint>
          </Field>

          <Field label="SEO description">
            <textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} rows={4} className="AdminInput" />
            <FieldHint tone={seoDescriptionLength > 160 ? 'warning' : 'default'}>{seoDescriptionLength}/160 recommended characters</FieldHint>
          </Field>
        </aside>
      </div>
    </section>
  );
}

function EditorToolbar({
  editor,
  onImageUpload,
  onError,
}: {
  editor: ReturnType<typeof useEditor>;
  onImageUpload: (file: File) => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [linkUrl, setLinkUrl] = useState('');

  if (!editor) return null;

  function applyLink() {
    const href = linkUrl.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank', rel: 'noopener noreferrer' }).run();
    setLinkUrl('');
  }

  return (
    <div className="border-b border-outline-variant p-2 flex flex-wrap items-center gap-2">
      <ToolbarButton label="Undo" active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} icon={<Undo2 className="w-4 h-4" />} />
      <ToolbarButton label="Redo" active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} icon={<Redo2 className="w-4 h-4" />} />
      <ToolbarDivider />
      <ToolbarButton label="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} icon={<Pilcrow className="w-4 h-4" />} />
      <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold className="w-4 h-4" />} />
      <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic className="w-4 h-4" />} />
      <ToolbarButton label="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough className="w-4 h-4" />} />
      <ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 className="w-4 h-4" />} />
      <ToolbarButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 className="w-4 h-4" />} />
      <ToolbarDivider />
      <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List className="w-4 h-4" />} />
      <ToolbarButton label="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered className="w-4 h-4" />} />
      <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote className="w-4 h-4" />} />
      <ToolbarButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<Code className="w-4 h-4" />} />
      <ToolbarButton label="Divider" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="w-4 h-4" />} />
      <ToolbarButton label="Clear formatting" active={false} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={<Eraser className="w-4 h-4" />} />
      <ToolbarDivider />
      <div className="flex items-center gap-1 min-w-0">
        <input
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyLink();
            }
          }}
          placeholder="https://"
          aria-label="Link URL"
          className="h-9 w-40 max-w-[42vw] border border-outline-variant rounded-sm px-2 font-body-md focus:outline-none focus:border-primary"
        />
        <ToolbarButton label="Apply link" active={editor.isActive('link')} onClick={applyLink} icon={<LinkIcon className="w-4 h-4" />} />
      </div>
      <ToolbarButton
        label="Image"
        active={false}
        onClick={() => {
          const src = window.prompt('Image URL');
          if (src) editor.chain().focus().setImage({ src }).run();
        }}
        icon={<Image className="w-4 h-4" />}
      />
      <label className="p-2 border border-outline-variant rounded-sm hover:bg-surface-variant cursor-pointer" title="Upload image" aria-label="Upload image">
        <Upload className="w-4 h-4" />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            if (file) void onImageUpload(file).catch((err: Error) => onError(err.message));
          }}
        />
      </label>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 border border-outline-variant rounded-sm disabled:opacity-40 ${active ? 'bg-primary text-on-primary' : 'hover:bg-surface-variant'}`}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="h-8 w-px bg-outline-variant" aria-hidden="true" />;
}

function StatusButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 border border-outline-variant rounded-sm px-2 font-label-caps ${
        active ? 'bg-primary text-on-primary border-primary' : 'text-secondary hover:text-primary'
      }`}
    >
      {icon}
      <span className="hidden sm:inline xl:hidden 2xl:inline">{label}</span>
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 border border-outline-variant rounded-sm px-3 py-2 bg-surface-container-lowest">
      <span className="font-body-md text-on-surface">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" />
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="font-label-caps text-secondary block mb-2">{label}</span>
      {children}
    </div>
  );
}

function FieldHint({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'warning' }) {
  return <span className={`font-code-sm block mt-2 ${tone === 'warning' ? 'text-primary' : 'text-secondary'}`}>{children}</span>;
}
