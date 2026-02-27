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
      <h1 className="page-title">Redirect Tracking</h1>
      <p className="text-muted text-sm mb-4">
        Clicks on tracking links (when &quot;Track redirects&quot; is enabled when sending reviews).
        Each hit is logged before redirecting to the rating page.
      </p>

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
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{e.redirectId}</td>
                    <td className="text-muted text-sm">
                      {new Date(e.hitAt).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>{e.ip || '—'}</td>
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
