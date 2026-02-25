'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function SendReviewForm({ manifests, prefilledManifestId }) {
  const router = useRouter();
  const [manifestId, setManifestId] = useState(prefilledManifestId || (manifests[0]?._id ?? ''));
  const [channel, setChannel] = useState('sms');
  const [trackRedirects, setTrackRedirects] = useState(false);
  const [message, setMessage] = useState("We'd love your feedback! Please rate your experience.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!manifestId) {
      setError('Select a manifest');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/api/review-requests/send', {
        manifestId,
        channel,
        trackRedirects,
        message,
      });
      setResult(res.results);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="form-group">
        <label className="form-label">Manifest</label>
        <select
          value={manifestId}
          onChange={(e) => setManifestId(e.target.value)}
          className="form-select"
        >
          <option value="">Select manifest</option>
          {manifests.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Channel</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="form-select"
        >
          <option value="sms">SMS (Twilio)</option>
          <option value="email">Email (SendGrid)</option>
        </select>
      </div>

      <label className="form-checkbox-label">
        <input
          type="checkbox"
          checked={trackRedirects}
          onChange={(e) => setTrackRedirects(e.target.checked)}
        />
        Track redirects (log link clicks before rating page)
      </label>

      <div className="form-group">
        <label className="form-label">Message (link is appended)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="form-textarea"
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {result && (
        <p className="form-success">
          Sent: {result.sent}, Failed: {result.failed}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn--primary">
        {loading ? 'Sending…' : 'Send review requests'}
      </button>
    </form>
  );
}
