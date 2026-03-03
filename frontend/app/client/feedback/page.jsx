'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const STAR_EMOJIS = ['', '😡', '😔', '😐', '😊', '😍'];

function RatingBadge({ value }) {
  if (!value) return <span style={{ color: '#94a3b8' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
      <span>{STAR_EMOJIS[value] || ''}</span>
      <span style={{ fontWeight: '600', color: '#334155' }}>{value}/5</span>
    </span>
  );
}

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const tableTopRef = useRef(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'negative'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchFeedback();
  }, [filter, currentPage]);

  useEffect(() => {
    const queryFilter = searchParams.get('filter');
    if (queryFilter === 'negative' || queryFilter === 'all') {
      setFilter(queryFilter);
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function fetchFeedback() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter, page: currentPage, limit });
      const data = await api.get(`/api/feedback?${params.toString()}`);
      setList(data.list || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to fetch feedback', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
    setCurrentPage(1);
  }

  function changePage(nextPage) {
    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      document.querySelector('.admin-shell__main')?.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  return (
    <div>
      <h1 className="page-title">Feedback</h1>
      <p className="text-muted text-sm mb-4">
        Displays private feedback submitted by passengers after their ride.
      </p>

      {/* Filter Tabs */}
      <div className="feedback-filter-toggle" role="tablist" aria-label="Feedback filters">
        {[
          { id: 'all', label: 'All' },
          { id: 'negative', label: 'Negative' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleFilterChange(tab.id)}
            className={`feedback-filter-toggle__button no-hover-anim${
              filter === tab.id
                ? tab.id === 'all'
                  ? ' feedback-filter-toggle__button--active-all'
                  : ' feedback-filter-toggle__button--active-negative'
                : ''
            }`}
            aria-pressed={filter === tab.id}
          >
            {tab.label}
            {tab.id === 'negative' && filter === 'negative' && list.length > 0 && (
              <span className="feedback-filter-toggle__count">
                {list.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card" ref={tableTopRef}>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading feedback...</p>
        ) : list.length === 0 ? (
          <p className="card__empty">No {filter === 'negative' ? 'negative ' : ''}feedback yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Comments</th>
                  <th>Contact</th>
                  <th>Driver Rating</th>
                  <th>Vehicle Rating</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => {
                  const displayText = f.comments || f.content || '';
                  const contact = f.reviewRequestId?.contactId;
                  const contactLabel = contact
                    ? [contact.name, contact.email].filter(Boolean).join(' · ') || '—'
                    : '—';
                  return (
                    <tr key={f._id}>
                      <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>
                        {displayText || <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td className="text-muted">{contactLabel}</td>
                      <td><RatingBadge value={f.driverRating} /></td>
                      <td><RatingBadge value={f.vehicleRating} /></td>
                      <td className="text-muted text-sm">
                        {new Date(f.submittedAt).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f1f5f9' : '#fff',
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#475569' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f1f5f9' : '#fff',
                color: currentPage === totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
