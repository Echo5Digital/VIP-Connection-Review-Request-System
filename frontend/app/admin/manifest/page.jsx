import Link from 'next/link';
import { api } from '@/lib/api';
import { ManifestUpload } from './ManifestUpload';

export default async function ManifestListPage() {
  let manifests = [];
  try {
    manifests = await api.get('/api/manifests');
  } catch {
    // ignore
  }

  return (
    <div>
      <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Manifests</h1>
        <ManifestUpload />
      </div>

      <div className="card">
        {manifests.length === 0 ? (
          <p className="card__empty">
            No manifests yet. Upload a CSV with columns: name, phone, email.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {manifests.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <Link href={`/admin/manifest/${m._id}`} style={{ fontWeight: 600 }}>
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
                    <td>
                      <Link href={`/admin/manifest/${m._id}`} className="btn btn--outline btn--sm">
                        View
                      </Link>
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
