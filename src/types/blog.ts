export type PostStatus = 'draft' | 'published' | 'archived';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type MediaAsset = {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  url: string;
  size_bytes: number;
  created_at: string;
};

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  status: PostStatus;
  is_featured: boolean;
  is_popular: boolean;
  display_order: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  tags: Tag[];
};

export type Post = PostListItem & {
  content_json: Record<string, unknown>;
  content_html?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  category_id?: string | null;
};

export type PostPayload = {
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  status: PostStatus;
  is_featured?: boolean;
  is_popular?: boolean;
  display_order?: number;
  content_json: Record<string, unknown>;
  content_html?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  category_id?: string | null;
  tag_ids: string[];
  published_at?: string | null;
};
