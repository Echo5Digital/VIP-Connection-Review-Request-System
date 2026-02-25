'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await api.post('/api/auth/logout');
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__brand">
          <em>VIP</em> Connection Customer Portal
        </div>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{ marginLeft: 'auto', marginRight: '24px' }}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </header>

      {children}
    </>
  );
}
