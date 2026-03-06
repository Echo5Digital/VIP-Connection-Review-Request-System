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
  const [uploadResult, setUploadResult] = useState(null);
  const [showExcluded, setShowExcluded] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a CSV or Excel file');
      return;
    }
    setError('');
    setUploadResult(null);
    setShowExcluded(false);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (name.trim()) form.append('name', name.trim());
      const result = await api.post('/api/manifests/upload', form);
      setFile(null);
      setName('');
      setUploadResult(result);
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

        {uploadResult && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadResult.total != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span>📋</span>
                <span>Total rows: {uploadResult.total}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--success, #22c55e)', fontWeight: 500 }}>
              <span>✓</span>
              <span>{uploadResult.imported} trip{uploadResult.imported !== 1 ? 's' : ''} imported</span>
            </div>

            {uploadResult.excluded?.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowExcluded(v => !v)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}
                >
                  <span>⛔</span>
                  <span>{uploadResult.excluded.length} trip{uploadResult.excluded.length !== 1 ? 's' : ''} excluded — Restriction List</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{showExcluded ? '▲' : '▼'}</span>
                </button>
                {showExcluded && (
                  <div style={{ marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {uploadResult.excluded.map((item, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{item.customerCode || '—'}</span>
                        {item.name ? ` · ${item.name}` : ''}
                        {item.reason ? <span style={{ opacity: 0.6 }}> — {item.reason}</span> : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {uploadResult.needsReview?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--warning, #f59e0b)', fontWeight: 500 }}>
                <span>⚠</span>
                <span>{uploadResult.needsReview.length} trip{uploadResult.needsReview.length !== 1 ? 's' : ''} need review (missing driver info)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
