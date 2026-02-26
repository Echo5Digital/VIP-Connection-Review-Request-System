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
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Subtitle</label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Thank you message</label>
        <input
          value={thankYouMessage}
          onChange={(e) => setThankYouMessage(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Google Review URL</label>
        <input
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          className="form-input"
          placeholder="https://search.google.com/local/writereview?placeid=..."
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading} className="btn btn--primary">
        {loading ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
