'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const emojiRatings = [
  { value: 1, emoji: '😞', label: 'Poor' },
  { value: 2, emoji: '🙁', label: 'Fair' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Excellent' },
];

function EmojiScale({ title, selected, onChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <p className="form-label" style={{ marginBottom: '8px' }}>{title}</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {emojiRatings.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            style={{
              minWidth: '58px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${selected === item.value ? 'var(--blue-500)' : 'var(--gray-300)'}`,
              background: selected === item.value ? 'var(--blue-500)' : '#fff',
              color: selected === item.value ? '#fff' : 'var(--gray-700)',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
            aria-label={`${title}: ${item.value} ${item.label}`}
          >
            <div style={{ fontSize: '20px', lineHeight: 1.2 }}>{item.emoji}</div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>{item.value}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomerReviewPage() {
  const [driverRating, setDriverRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [publicComment, setPublicComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (driverRating < 1 || driverRating > 5) {
      setError('Please select a driver rating between 1 and 5.');
      return;
    }
    if (vehicleRating < 1 || vehicleRating > 5) {
      setError('Please select a vehicle rating between 1 and 5.');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post('/api/rating/customer-submit', {
        driverRating,
        vehicleRating,
        publicComment: publicComment.trim() || undefined,
      });
      setSuccess(res.message || 'Rating submitted successfully.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gray-100)', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '560px', margin: '32px auto 0' }}>
        <div className="card__body">
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Customer Rating</h1>
          <p className="text-muted text-sm" style={{ marginBottom: '22px' }}>
            Rate your latest VIP Connection experience.
          </p>

          {success ? (
            <p className="badge badge--green" style={{ display: 'inline-block' }}>{success}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <EmojiScale
                title="Driver Rating (1-5)"
                selected={driverRating}
                onChange={setDriverRating}
              />

              <EmojiScale
                title="Vehicle Rating (1-5)"
                selected={vehicleRating}
                onChange={setVehicleRating}
              />

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Comment (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  maxLength={1000}
                  value={publicComment}
                  onChange={(event) => setPublicComment(event.target.value)}
                  placeholder="Share any additional feedback..."
                />
              </div>

              {error && <p className="form-error" style={{ marginBottom: '10px' }}>{error}</p>}

              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
