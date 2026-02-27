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
      <h1 className="page-title">Rating Page Settings</h1>
      <p className="text-muted text-sm mb-4">
        Customize the copy shown on the public rating page. Each review link looks like:{' '}
        <code style={{ background: 'var(--gray-200)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>/r/[token]</code>
      </p>
      <p className="text-muted text-xs mb-6">Example: {exampleUrl}</p>

      <div className="card">
        <div className="card__body">
          <RatingSettingsForm initial={ratingPage} />
        </div>
      </div>
    </div>
  );
}
