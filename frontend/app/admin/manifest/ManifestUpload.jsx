'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function ManifestUpload() {
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6">
      <div className="card__header">Upload Manifest File</div>
      <div style={{ padding: '24px' }}>
        <p className="text-muted text-sm mb-6">
          Upload a .csv or .xlsx file. All columns and rows will be captured.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '0 0 250px' }}>
            <input
              type="text"
              placeholder="Manifest name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
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
            <label
              htmlFor="manifest-file"
              className="btn btn--outline"
              style={{ display: 'inline-block', cursor: 'pointer', borderRadius: '4px', background: '#f8f9fb' }}
            >
              Choose File
            </label>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '0 12px' }}>
            {file ? file.name : 'No file chosen'}
          </span>

          <button type="submit" disabled={loading} className="btn btn--primary" style={{ borderRadius: '4px' }}>
            {loading ? 'Uploading...' : 'Upload File'}
          </button>

          {error && <p className="form-error" style={{ width: '100%', marginTop: '8px' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
