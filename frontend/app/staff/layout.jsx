'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { StaffProvider, useStaffContext } from './StaffContext';

const managerNav = [
  {
    href: '/staff/dashboard',
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
    href: '/staff/templates',
    label: 'Templates',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    href: '/staff/restrictions',
    label: 'Restriction List',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
  {
    href: '/staff/feedback',
    label: 'Complaints',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/staff/drivers',
    label: 'Driver Performance',
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
    href: '/staff/affiliates',
    label: 'Affiliate Performance',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

const dispatcherNav = [
  {
    href: '/staff/manifest',
    label: 'Upload Manifest',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    href: '/staff/manifest',
    label: 'Trips',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
    ),
  },
  {
    href: '/staff/manifest',
    label: 'Send Feedback Requests',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16" />
        <polyline points="22 2 11 13" />
        <polyline points="15 2 22 2 22 9" />
      </svg>
    ),
  },
];

function StaffLayoutInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useStaffContext();
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

  const isManager = user?.role === 'manager';
  const visibleNav = isManager ? managerNav : dispatcherNav;

  const pageTitle = useMemo(() => {
    if (pathname?.startsWith('/staff/dashboard')) return 'Dashboard';
    if (pathname?.startsWith('/staff/manifest')) return 'Trips';
    if (pathname?.startsWith('/staff/drivers')) return 'Driver Performance';
    if (pathname?.startsWith('/staff/affiliates')) return 'Affiliate Performance';
    if (pathname?.startsWith('/staff/feedback')) return 'Complaints';
    if (pathname?.startsWith('/staff/templates')) return 'Templates';
    if (pathname?.startsWith('/staff/restrictions')) return 'Restriction List';
    if (pathname?.startsWith('/staff/users')) return 'Users';
    if (pathname?.startsWith('/staff/profile')) return 'Settings';
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
        <div className="admin-shell__brand">
          VIP <span>CONNECTION</span>
        </div>
        <nav className="admin-shell__nav">
          {loading ? null : visibleNav.map((item, idx) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={`${item.href}-${idx}`}
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
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="admin-shell__title">{pageTitle}</h1>

          <div className="admin-shell__spacer" />

          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </header>

        <main className="admin-shell__main">{children}</main>
      </div>
    </div>
  );
}

export default function StaffLayout({ children }) {
  return (
    <StaffProvider>
      <StaffLayoutInner>{children}</StaffLayoutInner>
    </StaffProvider>
  );
}
