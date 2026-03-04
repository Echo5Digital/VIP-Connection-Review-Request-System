'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const STAR_EMOJIS = ['', '😡', '😔', '😐', '😊', '😍'];

function RatingBadge({ value }) {
  if (!value) return <span style={{ color: '#94a3b8' }}>-</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
      <span>{STAR_EMOJIS[value] || ''}</span>
      <span style={{ fontWeight: '600', color: '#334155' }}>{value}/5</span>
    </span>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export default function NegativeFeedbackTable({ title = 'Feedback' }) {
  const tableTopRef = useRef(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const limit = 20;

  useEffect(() => {
    fetchFeedback();
  }, [currentPage]);

  async function fetchFeedback() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter: 'negative', page: currentPage, limit });
      const data = await api.get(`/api/feedback?${params.toString()}`);
      setList(data.list || []);
      setTotalPages(data.pagination?.pages || 1);
      setExpandedRowId(null);
    } catch (err) {
      console.error('Failed to fetch feedback', err);
    } finally {
      setLoading(false);
    }
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

  function toggleRow(rowId) {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }

  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="text-muted text-sm mb-4">
        Displays private feedback submitted by passengers after their ride.
      </p>

      <div className="feedback-filter-label">
        <span className="feedback-filter-label__badge">
          Negative Feedback
          {list.length > 0 && (
            <span className="feedback-filter-toggle__count">{list.length}</span>
          )}
        </span>
      </div>

      <div className="card" ref={tableTopRef}>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading feedback...</p>
        ) : list.length === 0 ? (
          <p className="card__empty">No negative feedback yet.</p>
        ) : (
          <div className="table-wrap feedback-table-wrap">
            <table className="data-table feedback-data-table">
              <thead>
                <tr>
                  <th>ResNumber</th>
                  <th>Contact</th>
                  <th>Driver Rating</th>
                  <th>Vehicle Rating</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => {
                  const isExpanded = expandedRowId === f._id;
                  const contact = f.reviewRequestId?.contactId;
                  const contactLabel = contact
                    ? [contact.name, contact.email].filter(Boolean).join(' · ') || '-'
                    : '-';
                  const resNumber = String(f.resNumber || '').trim() || '-';
                  const fullComment = f.fullComment || '-';
                  const dispatchDriverName = f.dispatchDriverName || '-';
                  const dispatchVehicleTypeCode = f.dispatchVehicleTypeCode || '-';

                  return (
                    <Fragment key={f._id}>
                      <tr
                        className={`feedback-row ${isExpanded ? 'feedback-row--expanded' : ''}`}
                        onClick={() => toggleRow(f._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleRow(f._id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <td data-label="ResNumber" style={{ fontWeight: 600 }}>{resNumber}</td>
                        <td data-label="Contact" className="text-muted">{contactLabel}</td>
                        <td data-label="Driver Rating"><RatingBadge value={f.driverRating} /></td>
                        <td data-label="Vehicle Rating"><RatingBadge value={f.vehicleRating} /></td>
                        <td data-label="Date" className="text-muted text-sm">{formatDate(f.submittedAt)}</td>
                      </tr>
                      <tr className={`feedback-row-details ${isExpanded ? 'feedback-row-details--open' : ''}`}>
                        <td colSpan={5}>
                          <div className="feedback-row-details__content">
                            <div className="feedback-row-details__grid">
                              <div>
                                <div className="feedback-row-details__label">DispatchDriverName</div>
                                <div className="feedback-row-details__value">{dispatchDriverName}</div>
                              </div>
                              <div>
                                <div className="feedback-row-details__label">DispatchVehicleTypeCode</div>
                                <div className="feedback-row-details__value">{dispatchVehicleTypeCode}</div>
                              </div>
                            </div>
                            <div className="feedback-row-details__comment">
                              <div className="feedback-row-details__label">Full Comment</div>
                              <p className="feedback-row-details__value">{fullComment}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
