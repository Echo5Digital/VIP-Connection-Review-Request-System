'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const STAR_EMOJIS = ['', '😡', '😔', '😐', '😊', '😍'];

function RatingBadge({ value }) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
      <span>{STAR_EMOJIS[value] || ''}</span>
      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{value}/5</span>
    </span>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>{title}</h1>
          <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
            Private feedback submitted by passengers after their ride.
          </p>
        </div>
        <div className="badge badge--gold" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Negative Feedback
          {list.length > 0 && (
            <span style={{ opacity: 0.8, background: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{list.length}</span>
          )}
        </div>
      </div>

      <div className="card" ref={tableTopRef}>
        {loading ? (
          <div className="card__empty" style={{ padding: '60px' }}>
            <div className="page-loader" style={{ position: 'static', background: 'none' }}>Loading feedback...</div>
          </div>
        ) : list.length === 0 ? (
          <p className="card__empty">No negative feedback found.</p>
        ) : (
          <div className="table-wrap feedback-table-wrap">
            <table className="data-table feedback-data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>ResNumber</th>
                  <th>Contact</th>
                  <th>Driver Rating</th>
                  <th>Vehicle Rating</th>
                  <th style={{ paddingRight: '24px' }}>Date</th>
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
                        style={{
                          cursor: 'pointer',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--border-dim)',
                          background: isExpanded ? 'rgba(201, 162, 74, 0.03)' : 'transparent'
                        }}
                      >
                        <td data-label="ResNumber" style={{ fontWeight: 600, color: 'var(--accent)', paddingLeft: '24px' }}>{resNumber}</td>
                        <td data-label="Contact" style={{ color: 'var(--text-secondary)' }}>{contactLabel}</td>
                        <td data-label="Driver Rating"><RatingBadge value={f.driverRating} /></td>
                        <td data-label="Vehicle Rating"><RatingBadge value={f.vehicleRating} /></td>
                        <td data-label="Date" style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingRight: '24px', textAlign: 'right' }}>{formatDate(f.submittedAt)}</td>
                      </tr>
                      <tr className={`feedback-row-details ${isExpanded ? 'feedback-row-details--open' : ''}`}>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div className="feedback-row-details__content" style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', borderBottom: isExpanded ? '1px solid var(--border-dim)' : 'none' }}>
                            <div className="feedback-row-details__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                              <div>
                                <div className="feedback-row-details__label" style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.05em' }}>Driver Name</div>
                                <div className="feedback-row-details__value" style={{ fontWeight: 500, color: 'var(--text-main)' }}>{dispatchDriverName}</div>
                              </div>
                              <div>
                                <div className="feedback-row-details__label" style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.05em' }}>Vehicle Type</div>
                                <div className="feedback-row-details__value" style={{ fontWeight: 500, color: 'var(--text-main)' }}>{dispatchVehicleTypeCode}</div>
                              </div>
                            </div>
                            <div className="feedback-row-details__comment" style={{ padding: '18px', background: '#141414', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
                              <div className="feedback-row-details__label" style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px', letterSpacing: '0.05em' }}>Feedback Comment</div>
                              <p className="feedback-row-details__value" style={{ color: 'var(--text-main)', lineHeight: '1.6', margin: 0, fontSize: '14px' }}>{fullComment}</p>
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-dim)',
            background: 'rgba(255,255,255,0.01)'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentPage}</span> of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => changePage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn--secondary btn--sm"
              >
                Previous
              </button>
              <button
                onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn--secondary btn--sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
