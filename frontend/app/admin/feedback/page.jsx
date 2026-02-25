import { serverApi } from '@/lib/server-api';

export default async function FeedbackPage() {
  let list = [];
  try {
    list = await serverApi.get('/api/feedback');
  } catch {
    // ignore
  }

  return (
    <div>
      <h1 className="page-title">Private Feedback</h1>
      <p className="text-muted text-sm mb-4">
        Feedback submitted as &quot;private&quot; on the rating page. Only visible here.
      </p>

      <div className="card">
        {list.length === 0 ? (
          <p className="card__empty">No private feedback yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feedback</th>
                  <th>Contact</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => (
                  <tr key={f._id}>
                    <td style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{f.content}</td>
                    <td className="text-muted">
                      {f.reviewRequestId?.contactId
                        ? [f.reviewRequestId.contactId.name, f.reviewRequestId.contactId.email]
                          .filter(Boolean)
                          .join(' · ') || '—'
                        : '—'}
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(f.submittedAt).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
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
