'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PlatformsSettingsPage() {
  const [google, setGoogle] = useState('');
  const [yelp, setYelp] = useState('');
  const [tripAdvisor, setTripAdvisor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/settings/platforms')
      .then((data) => {
        if (data?.platformUrls) {
          setGoogle(data.platformUrls.google || '');
          setYelp(data.platformUrls.yelp || '');
          setTripAdvisor(data.platformUrls.tripAdvisor || '');
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api.patch('/api/settings/platforms', {
        platformUrls: { google: google.trim(), yelp: yelp.trim(), tripAdvisor: tripAdvisor.trim() },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Platform Review URLs</h1>
          <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
            Configure the links customers are directed to for public reviews.
          </p>
        </div>
        <button type="submit" form="platforms-form" disabled={saving} className="btn btn--primary btn--sm">
          {saving ? 'Saving...' : 'Save Links'}
        </button>
      </div>

      {loading ? (
        <p className="card__empty">Loading...</p>
      ) : (
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card__header" style={{ marginBottom: '16px' }}>
            <h3 className="card__title">Review Platform Links</h3>
          </div>
          <div className="card__body">
            <form id="platforms-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Google */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google Review URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                  value={google}
                  onChange={(e) => setGoogle(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                />
                <p className="text-muted text-xs mt-1">
                  Find your Place ID at <a href="https://developers.google.com/maps/documentation/places" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>developers.google.com</a>
                </p>
              </div>

              {/* Yelp */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#d32323">
                    <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.032c-.173-.281-.215-.63-.111-.962.103-.332.34-.59.65-.712.305-.12.636-.09.9.084l.02.014c.284.19 1.674 1.123 1.674 1.123-.158-.23-.335-.574-.526-.948L15 13.17c-.2-.385-.41-.785-.503-.998-.109-.252-.113-.543.006-.792.12-.25.338-.435.604-.52.262-.083.543-.048.772.097l.031.019L20 14.2c.261.16.409.434.409.718s-.148.558-.409.718C19.74 15.826 19.5 16 19.5 16l.048.038c.447.354 1.563.8 1.563.8zM12.5 2.5c.553 0 1 .448 1 1v6.5c0 .552-.447 1-1 1s-1-.448-1-1V3.5c0-.552.447-1 1-1zm-5.388 1.52c.479-.276 1.09-.113 1.366.366l3.25 5.629c.276.479.113 1.09-.366 1.366-.479.276-1.09.113-1.366-.366L7.146 5.386c-.276-.479-.113-1.09.366-1.366zM3.91 9.316c.276-.479.887-.642 1.366-.366l5.629 3.25c.479.276.642.887.366 1.366-.276.479-.887.642-1.366.366L4.276 10.682c-.479-.276-.642-.887-.366-1.366zm-.41 5.684c0-.553.447-1 1-1h6.5c.553 0 1 .447 1 1s-.447 1-1 1H4.5c-.553 0-1-.447-1-1zm2.146 5.366c-.276-.479-.113-1.09.366-1.366l5.629-3.25c.479-.276 1.09-.113 1.366.366.276.479.113 1.09-.366 1.366l-5.629 3.25c-.479.276-1.09.113-1.366-.366z" />
                  </svg>
                  Yelp Review URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                  value={yelp}
                  onChange={(e) => setYelp(e.target.value)}
                  placeholder="https://www.yelp.com/biz/..."
                />
              </div>

              {/* TripAdvisor */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#00aa6c">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" fill="#fff" />
                  </svg>
                  TripAdvisor Review URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                  value={tripAdvisor}
                  onChange={(e) => setTripAdvisor(e.target.value)}
                  placeholder="https://www.tripadvisor.com/UserReviewEdit..."
                />
              </div>

              {error && (
                <p className="form-error">{error}</p>
              )}

              {saved && (
                <p className="form-success">
                  Settings saved successfully.
                </p>
              )}

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-dim)', paddingTop: '20px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn--primary"
                  style={{ padding: '0 32px' }}
                >
                  {saving ? 'Saving…' : 'Save Platform Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
