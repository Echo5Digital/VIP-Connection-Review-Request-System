'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const EMOJIS = ['', '😡', '😔', '😐', '😊', '😍'];
const LABELS = ['', 'Poor', 'Below Average', 'Average', 'Above Average', 'Exceptional'];

function PrivateFeedbackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const driverRating = parseInt(searchParams.get('dr')) || 0;
  const vehicleRating = parseInt(searchParams.get('vr')) || 0;

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get(`/api/rating/page/${token}`)
      .then((data) => {
        if (data?.contactName) {
          setContactName(data.contactName);
          setName(data.contactName);
        }
        if (data?.contactEmail) {
          setContactEmail(data.contactEmail);
          setEmail(data.contactEmail);
        }
      })
      .catch(() => {});
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please enter your feedback comments.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/review-requests/private-feedback', {
        token,
        name: name.trim(),
        email: email.trim(),
        comments: comments.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
            Feedback Received
          </h1>
          <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
            Thank you — your feedback has been received. We take all feedback seriously and will use it to improve our service.
          </p>
          <p style={{ marginTop: '28px', fontSize: '13px', color: '#94a3b8' }}>
            © {new Date().getFullYear()} VIP Connection Review System
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            We Value Your Feedback
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            Your honest feedback helps us improve. Please let us know how we can do better.
          </p>
        </div>

        {/* Read-only Rating Summary */}
        {(driverRating > 0 || vehicleRating > 0) && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '28px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Ratings
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {driverRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>{EMOJIS[driverRating]}</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Driver</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                      {driverRating}/5 — {LABELS[driverRating]}
                    </div>
                  </div>
                </div>
              )}
              {vehicleRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>{EMOJIS[vehicleRating]}</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Vehicle</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                      {vehicleRating}/5 — {LABELS[vehicleRating]}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                padding: '0 12px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                padding: '0 12px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Comments <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={5}
              required
              placeholder="Please share what we could have done better..."
              style={{
                width: '100%',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                padding: '10px 12px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '8px',
              border: 'none',
              background: submitting ? '#94a3b8' : '#1e40af',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
          © {new Date().getFullYear()} VIP Connection Review System
        </p>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 20px',
  background: 'var(--gray-100, #f1f5f9)',
};

const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  padding: '40px 36px',
  maxWidth: '520px',
  width: '100%',
};

export default function PrivateFeedbackPage() {
  return (
    <Suspense>
      <PrivateFeedbackContent />
    </Suspense>
  );
}
