'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function RatingSettingsForm({ initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title ?? 'How was your experience?');
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? 'Your feedback helps us improve.');
  const [thankYouMessage, setThankYouMessage] = useState(initial.thankYouMessage ?? 'Thank you for your feedback!');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initial.googleReviewUrl ?? 'https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch('/api/settings', {
        ratingPage: { title, subtitle, thankYouMessage, googleReviewUrl }
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-control"
          placeholder="How was your experience?"
          style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Subtitle</label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="form-control"
          placeholder="Your feedback helps us improve."
          style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Thank you message</label>
        <input
          value={thankYouMessage}
          onChange={(e) => setThankYouMessage(e.target.value)}
          className="form-control"
          placeholder="Thank you for your feedback!"
          style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Google Review URL</label>
        <input
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          className="form-control"
          placeholder="https://search.google.com/local/writereview?placeid=..."
          style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={loading} className="btn btn--primary btn--sm" style={{ padding: '0 32px' }}>
          {loading ? 'Saving…' : 'Save Copy Settings'}
        </button>
      </div>
    </form>
  );
}
