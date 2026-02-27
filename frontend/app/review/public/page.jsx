'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const PLATFORMS = [
  {
    id: 'google',
    label: 'Google',
    color: '#4285f4',
    hoverColor: '#3367d6',
    border: '#bfdbfe',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'yelp',
    label: 'Yelp',
    color: '#d32323',
    hoverColor: '#b71c1c',
    border: '#fecaca',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#d32323' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z"/>
      </svg>
    ),
  },
  {
    id: 'tripadvisor',
    label: 'TripAdvisor',
    color: '#00aa6c',
    hoverColor: '#007a4d',
    border: '#bbf7d0',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#00aa6c' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14a4 4 0 110-8 4 4 0 010 8z"/>
      </svg>
    ),
  },
];

export default function PublicReviewPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [platformUrls, setPlatformUrls] = useState({ google: '', yelp: '', tripAdvisor: '' });
  const [clicked, setClicked] = useState({});
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  useEffect(() => {
    api.get('/api/settings/platforms')
      .then((data) => {
        if (data?.platformUrls) setPlatformUrls(data.platformUrls);
      })
      .catch(() => {})
      .finally(() => setLoadingPlatforms(false));
  }, []);

  async function handlePlatformClick(platform, url) {
    if (!url) return;
    setClicked(prev => ({ ...prev, [platform]: true }));
    if (token) {
      try {
        await api.post('/api/review-requests/track-public-click', { token, platform });
      } catch {
        // non-blocking — tracking failure should not stop the user
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const getUrlForPlatform = (id) => {
    if (id === 'tripadvisor') return platformUrls.tripAdvisor;
    return platformUrls[id] || '';
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      background: 'var(--gray-100, #f1f5f9)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: '48px 40px',
        maxWidth: '560px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Checkmark icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#0f172a',
          marginBottom: '12px',
        }}>
          Thank You for Your Rating!
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#475569',
          lineHeight: '1.6',
          marginBottom: '8px',
        }}>
          We are so glad you had a great experience with VIP Connection!
        </p>
        <p style={{
          fontSize: '15px',
          color: '#64748b',
          lineHeight: '1.6',
          marginBottom: '36px',
        }}>
          If you have a moment, we would love for you to share your experience on a review platform. It helps others discover our service and means a lot to our team.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PLATFORMS.map((p) => {
            const url = getUrlForPlatform(p.id);
            const isDisabled = loadingPlatforms || !url;
            const wasClicked = clicked[p.id];
            return (
              <button
                key={p.id}
                onClick={() => handlePlatformClick(p.id, url)}
                disabled={isDisabled}
                title={isDisabled ? `${p.label} review link not configured` : `Leave a review on ${p.label}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${p.border}`,
                  background: wasClicked ? '#f0fdf4' : '#fff',
                  color: isDisabled ? '#94a3b8' : p.color,
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'background 0.15s, transform 0.1s',
                  width: '100%',
                }}
                onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = wasClicked ? '#f0fdf4' : '#fff'; }}
              >
                {p.icon}
                <span>{wasClicked ? `Opened ${p.label}` : `Review us on ${p.label}`}</span>
                {!isDisabled && !wasClicked && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <p style={{ marginTop: '28px', fontSize: '13px', color: '#94a3b8' }}>
          © {new Date().getFullYear()} VIP Connection Review System
        </p>
      </div>
    </main>
  );
}
