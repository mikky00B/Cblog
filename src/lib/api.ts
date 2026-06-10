import type { Category, MediaAsset, Post, PostListItem, PostPayload, Tag } from '../types/blog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const TOKEN_KEY = 'clevermike_admin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const blogApi = {
  listPosts: (params: { category?: string; limit?: number; offset?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    if (params.limit) search.set('limit', String(params.limit));
    if (params.offset) search.set('offset', String(params.offset));
    const query = search.toString();
    return request<PostListItem[]>(`/posts${query ? `?${query}` : ''}`);
  },
  getPost: (slug: string) => request<Post>(`/posts/${slug}`),
  searchPosts: (query: string) => request<PostListItem[]>(`/search?q=${encodeURIComponent(query)}`),
  listCategories: () => request<Category[]>('/categories'),
};

export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

export const adminApi = {
  listPosts: () => request<PostListItem[]>('/admin/posts'),
  getPost: (id: string) => request<Post>(`/admin/posts/${id}`),
  listCategories: () => request<Category[]>('/admin/categories'),
  createCategory: (payload: Pick<Category, 'name' | 'slug'> & { description?: string | null }) =>
    request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listTags: () => request<Tag[]>('/admin/tags'),
  createTag: (payload: Pick<Tag, 'name' | 'slug'>) =>
    request<Tag>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listMedia: () => request<MediaAsset[]>('/admin/media'),
  uploadMedia: async (file: File) => {
    const token = getAdminToken();
    const body = new FormData();
    body.append('file', file);

    const response = await fetch(`${API_BASE_URL}/admin/media`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.detail ?? `Upload failed with ${response.status}`);
    }
    return response.json() as Promise<MediaAsset>;
  },
  createPost: (payload: PostPayload) =>
    request<Post>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePost: (id: string, payload: Partial<PostPayload>) =>
    request<Post>(`/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePost: (id: string) =>
    request<void>(`/admin/posts/${id}`, {
      method: 'DELETE',
    }),
};
