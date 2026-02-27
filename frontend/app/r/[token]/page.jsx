'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { EmojiRatingGroup } from '@/components/EmojiRatingGroup';

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverRating, setDriverRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [publicComment, setPublicComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get(`/api/rating/page/${token}`)
      .then(setData)
      .catch(() =>
        setData({
          alreadySubmitted: false,
          title: 'Rate Our Service',
          subtitle: 'Thank you for using VIP Connection. On a scale of 1 to 5, how would you rate your satisfaction with the Driver and Vehicle?',
        })
      )
      .finally(() => setLoading(false));
  }, [token]);

  const submit = useCallback(async () => {
    if (!token || driverRating < 1 || vehicleRating < 1) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.post('/api/rating/submit', {
        token,
        driverRating,
        vehicleRating,
        publicComment: publicComment.trim() || undefined,
      });
      // Route based on ratings
      if (result.redirect === 'public') {
        router.push(`/review/public?token=${token}`);
      } else {
        router.push(`/review/private?token=${token}&dr=${driverRating}&vr=${vehicleRating}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [token, driverRating, vehicleRating, publicComment, router]);

  if (loading) {
    return (
      <main className="wrap">
        <p className="text-muted">Loading…</p>
        <style jsx>{`
          .wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--gray-100);
          }
        `}</style>
      </main>
    );
  }

  if (data?.alreadySubmitted) {
    return (
      <main className="wrap">
        <div className="card rating-card">
          <div className="card__body">
            <h1 className="rating-card__title">Thank you</h1>
            <p className="text-muted">
              You have already submitted your rating.
            </p>
          </div>
        </div>
        <style jsx>{`
          .wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--gray-100);
          }
          .rating-card {
            text-align: center;
            max-width: 480px;
            width: 100%;
          }
          .rating-card__title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--gray-800);
          }
        `}</style>
      </main>
    );
  }

  const title = data?.title || 'How was your experience?';
  const subtitle = data?.subtitle || 'Your feedback helps us improve.';

  return (
    <main className="wrap">
      <div className="card rating-card">
        <div className="card__body">
          <header className="rating-card__header">
            <h1 className="rating-card__title">{title}</h1>
            <p className="rating-card__subtitle">{subtitle}</p>
          </header>

          <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <EmojiRatingGroup
              title="Driver Rating"
              selected={driverRating}
              onChange={setDriverRating}
            />

            <EmojiRatingGroup
              title="Vehicle Rating"
              selected={vehicleRating}
              onChange={setVehicleRating}
            />

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Comments:</label>
              <textarea
                value={publicComment}
                onChange={(e) => setPublicComment(e.target.value)}
                rows={4}
                placeholder="Please provide any additional feedback..."
                className="form-textarea"
                style={{ resize: 'none' }}
              />
            </div>

            {error && <p className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={submitting || driverRating < 1 || vehicleRating < 1}
                className="btn btn--success"
                style={{ padding: '12px 32px', fontSize: '16px' }}
              >
                {submitting ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background: var(--gray-100);
        }
        .rating-card {
          width: 100%;
          max-width: 600px;
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-xl);
          border: none;
        }
        .rating-card__header {
          text-align: center;
          margin-bottom: 32px;
        }
        .rating-card__title {
          font-size: 24px;
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 8px;
        }
        .rating-card__subtitle {
          font-size: 15px;
          color: var(--gray-500);
        }
      `}</style>
    </main>
  );
}
