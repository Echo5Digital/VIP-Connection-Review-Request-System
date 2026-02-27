'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ManifestUpload } from './ManifestUpload';

export default function ManifestListPage() {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchManifests();
  }, []);

  async function fetchManifests() {
    try {
      setLoading(true);
      const data = await api.get('/api/manifests');
      setManifests(data || []);
    } catch (err) {
      console.error('Failed to fetch manifests', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this manifest and all its contacts?')) return;
    try {
      await api.delete(`/api/manifests/${id}`);
      fetchManifests();
    } catch (err) {
      alert('Failed to delete manifest: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  const filteredManifests = manifests.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredManifests.length / limit);
  const paginatedManifests = filteredManifests.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Manifests</h1>
      </div>

      <ManifestUpload />

      <div className="card">
        <div className="card__header">Imported Manifests</div>

        {/* Search Section */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-200)', background: '#fcfcfd' }}>
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by manifest name"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                paddingLeft: '40px',
                height: '40px',
                borderRadius: '8px',
                borderColor: '#cbd5e1',
                fontSize: '14px',
                width: '100%'
              }}
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--blue-500)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {loading ? (
          <p className="card__empty">Loading manifests...</p>
        ) : manifests.length === 0 ? (
          <p className="card__empty">
            No manifests yet. Upload a CSV with columns: name, phone, email.
          </p>
        ) : filteredManifests.length === 0 ? (
          <p className="card__empty">No manifests match your search.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Manifest Name</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedManifests.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <Link href={`/admin/manifest/${m._id}`} style={{ fontWeight: 600, color: 'var(--blue-600)' }}>
                          {m.name}
                        </Link>
                      </td>
                      <td className="text-muted">
                        {new Date(m.createdAt).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Link href={`/admin/manifest/${m._id}`} className="btn btn--sm" style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDelete(m._id)}
                            className="btn btn--sm"
                            style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fee2e2',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--gray-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                background: '#fff'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                  Showing <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{(currentPage - 1) * limit + 1}</span> to <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{Math.min(currentPage * limit, filteredManifests.length)}</span> of <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{filteredManifests.length}</span> manifests
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="btn btn--sm btn--outline"
                    style={{ borderRadius: '6px', minWidth: '80px' }}
                  >
                    Previous
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: currentPage === pageNum ? 'var(--blue-600)' : 'var(--gray-200)',
                              background: currentPage === pageNum ? 'var(--blue-600)' : 'transparent',
                              color: currentPage === pageNum ? '#fff' : 'var(--gray-700)',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} style={{ padding: '0 4px', color: 'var(--gray-400)' }}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="btn btn--sm btn--outline"
                    style={{ borderRadius: '6px', minWidth: '80px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
