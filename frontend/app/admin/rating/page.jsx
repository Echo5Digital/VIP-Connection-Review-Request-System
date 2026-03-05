import { serverApi } from '@/lib/server-api';
import { RatingSettingsForm } from './RatingSettingsForm';

export default async function RatingPageAdmin() {
  let settings = {};
  try {
    settings = await serverApi.get('/api/settings');
  } catch {
    // ignore
  }
  const ratingPage = settings.ratingPage || {};
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const exampleUrl = `${baseUrl}/r/YOUR_TOKEN`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title" style={{ margin: 0 }}>Rating Page Settings</h1>
        <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
          Customize the copy shown on the public rating page.
        </p>
      </div>

      <div className="card mb-6" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)' }}>
        <div className="card__body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Review URL Pattern:</span>
            <code style={{ background: '#141414', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border-dim)' }}>/r/[token]</code>
          </div>
          <p className="text-secondary" style={{ fontSize: '12px', marginTop: '8px' }}>Example: <span style={{ color: 'var(--text-main)' }}>{exampleUrl}</span></p>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <RatingSettingsForm initial={ratingPage} />
        </div>
      </div>
    </div>
  );
}
