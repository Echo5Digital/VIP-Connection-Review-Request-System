import { serverApi } from '@/lib/server-api';

export default async function RedirectsPage({ searchParams }) {
  const params = await searchParams;
  let events = [];
  try {
    events = await serverApi.get('/api/redirects', { params });
  } catch {
    // ignore
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Redirect Tracking</h1>
        <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
          Monitor clicks on tracking links sent to passengers.
        </p>
      </div>

      <div className="card">
        {events.length === 0 ? (
          <p className="card__empty">
            No redirect events yet. Enable &quot;Track redirects&quot; when sending review requests.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Redirect ID</th>
                  <th>Hit At</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e._id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>{e.redirectId}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(e.hitAt).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ color: 'var(--text-main)' }}>{e.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
