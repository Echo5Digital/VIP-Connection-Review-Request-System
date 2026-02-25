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
      setError('Choose a CSV file');
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Manifest name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="form-input"
        style={{ width: '180px' }}
      />
      <input
        type="file"
        accept=".csv,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ fontSize: '13px', color: 'var(--gray-600)' }}
      />
      <button type="submit" disabled={loading} className="btn btn--primary btn--sm">
        {loading ? 'Uploading…' : 'Upload CSV'}
      </button>
      {error && <p className="form-error" style={{ width: '100%' }}>{error}</p>}
    </form>
  );
}
