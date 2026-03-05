'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';

const nav = [
  {
    href: '/client/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/client/manifest',
    label: 'Trips',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
    ),
  },
  {
    href: '/client/drivers',
    label: 'Drivers',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" />
        <rect x="2" y="13" width="20" height="6" rx="2" />
        <circle cx="7" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </svg>
    ),
  },
  {
    href: '/client/feedback',
    label: 'Feedback',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Apply dynamic branding
  useEffect(() => {
    async function applyBranding() {
      try {
        const settings = await api.get('/api/settings');
        if (settings?.branding?.themeColors?.primary) {
          const primaryColor = settings.branding.themeColors.primary;
          document.documentElement.style.setProperty('--blue-500', primaryColor);
          document.documentElement.style.setProperty('--primary-600', primaryColor);
        }
      } catch (err) {
        console.error('Failed to apply branding', err);
      }
    }
    applyBranding();
  }, []);

  const pageTitle = useMemo(() => {
    if (pathname?.startsWith('/client/dashboard')) return 'Dashboard';
    if (pathname?.startsWith('/client/manifest')) return 'Trips';
    if (pathname?.startsWith('/client/drivers')) return 'Drivers';
    if (pathname?.startsWith('/client/feedback')) return 'Feedback';
    return 'Dashboard';
  }, [pathname]);

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
    <div className="admin-shell">
      <aside className={`admin-shell__sidebar${isSidebarOpen ? ' admin-shell__sidebar--open' : ''}`}>
        <div className="admin-shell__brand">VIP Connection</div>
        <nav className="admin-shell__nav">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-shell__nav-link${isActive ? ' admin-shell__nav-link--active' : ''}`}
              >
                <span className="admin-shell__nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {isSidebarOpen && <button type="button" className="admin-shell__overlay" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" />}

      <div className="admin-shell__content">
        <header className="admin-shell__header">
          <button type="button" className="admin-shell__menu-btn" onClick={() => setIsSidebarOpen((v) => !v)} aria-label="Toggle menu">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="admin-shell__title">{pageTitle}</h1>
          <div className="admin-shell__spacer" />

          <div className="admin-shell__profile-menu" ref={profileMenuRef}>
            <button
              type="button"
              className="admin-shell__profile-trigger"
              title="Client Menu"
              onClick={() => setIsProfileMenuOpen((v) => !v)}
            >
              <span>Client</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isProfileMenuOpen && (
              <div className="admin-shell__profile-dropdown">
                <button
                  type="button"
                  className="admin-shell__profile-item admin-shell__profile-item--danger"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="admin-shell__main">{children}</main>
      </div>
    </div>
  );
}
