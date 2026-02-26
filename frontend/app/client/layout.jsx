'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
        href: '/client/review',
        label: 'Submit Review',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

export default function ClientLayout({ children }) {
    const pathname = usePathname();
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
                    <em>VIP</em> Connection Client Portal
                </div>
                <div style={{ flex: 1 }} />
                <button type="button" className="btn btn--inverse btn--sm" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </header>

            <aside className="app-sidebar">
                <nav className="app-sidebar__nav">
                    {nav.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`}
                            >
                                <span className="app-sidebar__icon">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <main className="app-main">{children}</main>
        </>
    );
}
