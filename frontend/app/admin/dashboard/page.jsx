import Link from 'next/link';
import { api } from '@/lib/api';

/* ── Status badge helper ── */
function statusBadge(status) {
  const map = {
    sent: { label: 'Sent', cls: 'badge--green' },
    delivered: { label: 'Delivered', cls: 'badge--teal' },
    failed: { label: 'Failed', cls: 'badge--red' },
    clicked: { label: 'Link Clicked', cls: 'badge--purple' },
    feedback: { label: 'Feedback Received', cls: 'badge--orange' },
    notsent: { label: 'Not Sent', cls: 'badge--yellow' },
  };
  const s = map[status] || { label: status || 'Unknown', cls: 'badge--gray' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

/* ── Format ID for display ── */
function shortId(id) {
  if (!id) return '—';
  return id.slice(-5).toUpperCase();
}

export default async function DashboardPage() {
  let manifests = [];
  let reviewRequests = [];
  try {
    [manifests, reviewRequests] = await Promise.all([
      api.get('/api/manifests'),
      api.get('/api/review-requests'),
    ]);
  } catch {
    // ignore
  }

  const sentCount = reviewRequests.length;
  const failedCount = reviewRequests.filter(r => r.status === 'failed').length;

  /* Paginate client-side for now (first 10) */
  const perPage = 10;
  const total = reviewRequests.length;
  const items = reviewRequests.slice(0, perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-card__label">Manifests</p>
          <p className="stat-card__value">{manifests.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Review Requests</p>
          <p className="stat-card__value">{sentCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Failed</p>
          <p className="stat-card__value">{failedCount}</p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="filter-bar">
        <span className="filter-bar__label">Filter by Status:</span>
        <select className="filter-bar__select" defaultValue="all">
          <option value="all">All</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
        <span className="filter-bar__tag">Total:&nbsp;<strong>{total}</strong></span>
        <input className="filter-bar__search" placeholder="Search..." />
      </div>

      {/* ── Rides list ── */}
      <div className="card">
        <div className="card__header">Rides List</div>
        {items.length === 0 ? (
          <p className="card__empty">
            No review requests yet. Upload a manifest and send reviews.
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ride ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{shortId(r._id)}</td>
                      <td className="text-muted">
                        {new Date(r.sentAt).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{r.contactId?.name || r.contactId?.email || '—'}</td>
                      <td>
                        <span className={`badge ${r.channel === 'sms' ? 'badge--blue' : 'badge--purple'}`}>
                          {r.channel === 'sms' ? 'SMS' : 'Email'}
                        </span>
                      </td>
                      <td>{statusBadge(r.status)}</td>
                      <td>
                        {r.status === 'sent' || r.status === 'delivered' ? (
                          <Link href="/admin/feedback" className="btn btn--primary btn--sm">
                            View Feedback
                          </Link>
                        ) : r.status === 'failed' ? (
                          <Link href="/admin/send-review" className="btn btn--outline btn--sm">
                            Retry
                          </Link>
                        ) : (
                          <Link href="/admin/send-review" className="btn btn--success btn--sm">
                            Send Review Request
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="pagination-wrap">
              <span className="pagination-info">
                Showing 1 to {Math.min(perPage, total)} of {total} entries
              </span>
              <div className="pagination-btns">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <span key={i} className={i === 0 ? 'active' : ''}>
                    {i + 1}
                  </span>
                ))}
                {totalPages > 5 && <span>…</span>}
                {totalPages > 5 && <span>{totalPages}</span>}
                <span>Next&nbsp;›</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
