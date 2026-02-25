import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';

export default async function ManifestDetailPage({ params }) {
  const { id } = await params;
  let data = null;
  try {
    data = await api.get(`/api/manifests/${id}`);
  } catch {
    notFound();
  }
  const { name, contacts } = data;

  return (
    <div>
      <div className="flex-center mb-6" style={{ gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/admin/manifest" className="text-muted text-sm" style={{ textDecoration: 'none' }}>
          ← Manifests
        </Link>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{name}</h1>
        <span style={{ flex: 1 }} />
        <Link href={`/admin/send-review?manifestId=${id}`} className="btn btn--primary btn--sm">
          Send review to this manifest
        </Link>
      </div>

      <p className="text-muted text-sm mb-4">{contacts.length} contact(s)</p>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 500 }}>{c.name || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
