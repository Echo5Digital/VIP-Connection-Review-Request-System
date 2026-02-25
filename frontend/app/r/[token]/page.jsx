'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function RatingPage() {
  const params = useParams();
  const token = params?.token;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [publicComment, setPublicComment] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [thankYou, setThankYou] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get(`/api/rating/page/${token}`)
      .then(setData)
      .catch(() =>
        setData({
          alreadySubmitted: false,
          title: 'Rate your experience',
          subtitle: 'Your feedback helps us improve.',
        })
      )
      .finally(() => setLoading(false));
  }, [token]);

  const submit = useCallback(async () => {
    if (!token || rating < 1 || rating > 5) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/rating/submit', {
        token,
        rating,
        publicComment: publicComment.trim() || undefined,
        privateFeedback: privateFeedback.trim() || undefined,
      });
      setThankYou(res.thankYouMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [token, rating, publicComment, privateFeedback]);

  /* Centered page wrapper */
  const wrapStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'var(--gray-100)',
  };

  if (loading) {
    return (
      <main style={wrapStyle}>
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  if (data?.alreadySubmitted) {
    return (
      <main style={wrapStyle}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <div className="card__body" style={{ padding: '40px 24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: 'var(--gray-800)' }}>Thank you</h1>
            <p className="text-muted">You have already submitted your rating ({data.rating} stars).</p>
          </div>
        </div>
      </main>
    );
  }

  if (thankYou) {
    return (
      <main style={wrapStyle}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <div className="card__body" style={{ padding: '40px 24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gray-800)' }}>{thankYou}</h1>
          </div>
        </div>
      </main>
    );
  }

  const title = data?.title || 'How was your experience?';
  const subtitle = data?.subtitle || 'Your feedback helps us improve.';

  return (
    <main style={wrapStyle}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card__body" style={{ padding: '28px 24px' }}>
          <h1 style={{ marginBottom: '6px', fontSize: '20px', fontWeight: 700, color: 'var(--gray-800)' }}>{title}</h1>
          <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>{subtitle}</p>

          {/* Star rating */}
          <div style={{ marginBottom: '20px' }}>
            <p className="form-label" style={{ marginBottom: '8px' }}>Rating (1–5)</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${rating === n ? 'var(--blue-500)' : 'var(--gray-300)'}`,
                    background: rating === n ? 'var(--blue-500)' : '#fff',
                    color: rating === n ? '#fff' : 'var(--gray-700)',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Public comment */}
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Public comment (optional)</label>
            <textarea
              value={publicComment}
              onChange={(e) => setPublicComment(e.target.value)}
              rows={2}
              placeholder="Share publicly..."
              className="form-textarea"
            />
          </div>

          {/* Private feedback */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Private feedback (optional)</label>
            <textarea
              value={privateFeedback}
              onChange={(e) => setPrivateFeedback(e.target.value)}
              rows={2}
              placeholder="Only we will see this..."
              className="form-textarea"
            />
          </div>

          {error && <p className="form-error" style={{ marginBottom: '8px' }}>{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={submitting || rating < 1}
            className="btn btn--primary"
            style={{ width: '100%', padding: '10px' }}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </main>
  );
}
