'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';

const nav = [
  {
    href: '/admin/dashboard',
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
    href: '/admin/manifest',
    label: 'Review Request',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/drivers',
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
    href: '/admin/clients',
    label: 'Clients',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/feedback',
    label: 'Feedback',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }) {
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

  const pageTitle = useMemo(() => {
    if (pathname?.startsWith('/admin/dashboard')) return 'Dashboard';
    if (pathname?.startsWith('/admin/manifest')) return 'Review Request';
    if (pathname?.startsWith('/admin/drivers')) return 'Drivers';
    if (pathname?.startsWith('/admin/clients')) return 'Clients';
    if (pathname?.startsWith('/admin/feedback')) return 'Feedback';
    if (pathname?.startsWith('/admin/profile')) return 'Settings';
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
              title="Admin Menu"
              onClick={() => setIsProfileMenuOpen((v) => !v)}
            >
              <span>Admin</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isProfileMenuOpen && (
              <div className="admin-shell__profile-dropdown">
                <Link href="/admin/profile" className="admin-shell__profile-item">
                  Settings
                </Link>
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
