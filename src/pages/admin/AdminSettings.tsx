import { FormEvent, useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { slugify } from '../../lib/slug';
import type { Category, Tag } from '../../types/blog';

export function AdminSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [tagName, setTagName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.listCategories(), adminApi.listTags()])
      .then(([nextCategories, nextTags]) => {
        setCategories(nextCategories);
        setTags(nextTags);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    const created = await adminApi.createCategory({ name: categoryName, slug: slugify(categoryName) });
    setCategories((current) => [...current, created]);
    setCategoryName('');
  }

  async function addTag(event: FormEvent) {
    event.preventDefault();
    const created = await adminApi.createTag({ name: tagName, slug: slugify(tagName) });
    setTags((current) => [...current, created]);
    setTagName('');
  }

  return (
    <section>
      <div className="border-b border-outline-variant pb-stack-md mb-stack-lg">
        <h1 className="font-headline-md text-primary">Settings</h1>
        <p className="font-body-md text-secondary mt-2">Manage editorial categories and tags.</p>
      </div>
      {error && <p className="font-body-md text-secondary mb-stack-md">API error: {error}</p>}
      <div className="grid md:grid-cols-2 gap-gutter">
        <Panel title="Categories" values={categories.map((item) => item.name)} onSubmit={addCategory} value={categoryName} onChange={setCategoryName} />
        <Panel title="Tags" values={tags.map((item) => item.name)} onSubmit={addTag} value={tagName} onChange={setTagName} />
      </div>
    </section>
  );
}

function Panel({
  title,
  values,
  value,
  onChange,
  onSubmit,
}: {
  title: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="border border-outline-variant bg-surface-container-lowest rounded-sm p-stack-md">
      <h2 className="font-headline-sm text-primary mb-stack-md">{title}</h2>
      <form onSubmit={onSubmit} className="flex gap-2 mb-stack-md">
        <input value={value} onChange={(event) => onChange(event.target.value)} className="AdminInput" required />
        <button className="bg-primary text-on-primary px-4 py-2 font-label-caps rounded-sm">Add</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <span key={item} className="border border-outline-variant px-2 py-1 rounded-sm font-label-caps text-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
