'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function ManifestUpload({ onUploadSuccess }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a CSV or Excel file');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (name.trim()) form.append('name', name.trim());
      await api.post('/api/manifests/upload', form);
      setFile(null);
      setName('');
      if (onUploadSuccess) {
        onUploadSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6">
      <div className="card__header">Upload Manifest File</div>
      <div className="card__body">
        <p className="text-muted text-sm mb-6">
          Upload a .csv or .xlsx file. All columns and rows will be captured.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
          <div className="form-group" style={{ flex: '1 1 280px', marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Manifest name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              style={{ width: '100%', height: '42px', borderRadius: '8px' }}
            />
          </div>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="file"
              id="manifest-file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
            <button
              type="button"
              className="btn btn--secondary"
              style={{ pointerEvents: 'none' }}
            >
              Choose File
            </button>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: '120px' }}>
            {file ? file.name : 'No file chosen'}
          </span>

          <button type="submit" disabled={loading} className="btn btn--primary">
            {loading ? 'Uploading...' : 'Upload Manifest'}
          </button>

          {error && <p className="form-error" style={{ width: '100%', marginTop: '12px', marginBottom: 0 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
