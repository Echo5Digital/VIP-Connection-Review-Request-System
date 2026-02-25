import Link from 'next/link';
import { serverApi } from '@/lib/server-api';

export default async function DashboardPage() {
  let manifests = [];
  let reviewRequests = [];
  try {
    [manifests, reviewRequests] = await Promise.all([
      serverApi.get('/api/manifests'),
      serverApi.get('/api/review-requests'),
    ]);
  } catch {
    // ignore
  }

  const sentCount = reviewRequests.length;
  const failedCount = reviewRequests.filter(r => r.status === 'failed').length;
  const manifestsCount = manifests.length;

  return (
    <div className="dash-container">
      <div className="dash-header">
        <h1 className="text-headline">Overview</h1>
        <p className="text-subhead">Manage your review requests, drivers, and feedback.</p>
      </div>

      <div className="dash-grid">
        {/* Manifests Block */}
        <Link href="/admin/manifest" className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
            </div>
            <h2 className="dash-card__title">Manifests</h2>
          </div>
          <div className="dash-card__body">
            <p className="text-body">Upload and manage your daily ride manifests in CSV format to trigger automated texts.</p>
            <div className="dash-card__stat-group">
              <span className="dash-card__stat dash-card__stat--blue">
                {manifestsCount} {manifestsCount === 1 ? 'Manifest' : 'Manifests'}
              </span>
            </div>
          </div>
          <div className="dash-card__footer">
            Manage Manifests
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Send Review Block */}
        <Link href="/admin/send-review" className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <h2 className="dash-card__title">Send Review Requests</h2>
          </div>
          <div className="dash-card__body">
            <p className="text-body">Manually orchestrate and resend review requests to clients via SMS and Email channels.</p>
            <div className="dash-card__stat-group">
              <span className="dash-card__stat">
                {sentCount} Total Sent
              </span>
              {failedCount > 0 && (
                <span className="dash-card__stat dash-card__stat--red">
                  {failedCount} Failed
                </span>
              )}
            </div>
          </div>
          <div className="dash-card__footer">
            Send Requests
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Drivers Block */}
        <Link href="/admin/drivers" className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" />
                <rect x="2" y="13" width="20" height="6" rx="2" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
              </svg>
            </div>
            <h2 className="dash-card__title">Drivers</h2>
          </div>
          <div className="dash-card__body">
            <p className="text-body">View your active driver roster. Map aliases from your manifest CSVs to the actual drivers.</p>
          </div>
          <div className="dash-card__footer">
            Manage Drivers
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Feedback Block */}
        <Link href="/admin/feedback" className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="dash-card__title">Internal Feedback</h2>
          </div>
          <div className="dash-card__body">
            <p className="text-body">Review and manage internal negative feedback submitted directly by clients.</p>
          </div>
          <div className="dash-card__footer">
            View Feedback
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Redirects Block */}
        <Link href="/admin/redirects" className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15,3 21,3 21,9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <h2 className="dash-card__title">Redirects</h2>
          </div>
          <div className="dash-card__body">
            <p className="text-body">Configure platform-specific short link redirects for positive review routing.</p>
          </div>
          <div className="dash-card__footer">
            Configure Redirects
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Rating Block */}
        <Link href="/admin/rating" className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h2 className="dash-card__title">Rating Config</h2>
          </div>
          <div className="dash-card__body">
            <p className="text-body">Fine-tune the threshold rating required to prompt external public reviews.</p>
          </div>
          <div className="dash-card__footer">
            Adjust Rating Config
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
