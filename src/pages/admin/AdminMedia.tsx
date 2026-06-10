import { ChangeEvent, useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { adminApi } from '../../lib/api';
import type { MediaAsset } from '../../types/blog';

export function AdminMedia() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    adminApi.listMedia().then(setAssets).catch((err: Error) => setError(err.message));
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const asset = await adminApi.uploadMedia(file);
      setAssets((current) => [asset, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-stack-md border-b border-outline-variant pb-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-primary">Media</h1>
          <p className="font-body-md text-secondary mt-2">Upload and copy image URLs for articles.</p>
        </div>
        <label className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-3 font-label-caps rounded-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      {error && <p className="font-body-md text-secondary mb-stack-md">API error: {error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-stack-md">
        {assets.map((asset) => (
          <article key={asset.id} className="border border-outline-variant rounded-sm overflow-hidden bg-surface-container-lowest">
            <img src={asset.url} alt={asset.original_filename} className="w-full aspect-video object-cover bg-surface-variant" />
            <div className="p-stack-sm">
              <p className="font-body-md text-primary truncate">{asset.original_filename}</p>
              <button onClick={() => navigator.clipboard.writeText(asset.url)} className="font-label-caps text-secondary hover:text-primary mt-2">
                Copy URL
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
