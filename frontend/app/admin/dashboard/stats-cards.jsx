'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AdminDashboardCards({ cards, counts }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function normalizePath(path) {
    if (!path) return '/';
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }

  function isCardActive(href) {
    const target = new URL(href, 'http://localhost');
    if (normalizePath(pathname) !== normalizePath(target.pathname)) return false;

    for (const [key, value] of target.searchParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  }

  return (
    <section className="dashboard-stats" aria-label="Dashboard summary cards">
      {cards.map((card) => {
        const isNegativeActive = card.negative && isCardActive(card.href);
        return (
          <Link
            key={card.key}
            href={card.href}
            className={`dashboard-stat-card${card.primary ? ' dashboard-stat-card--primary' : ''}${card.negative ? ' dashboard-stat-card--negative' : ''}${isNegativeActive ? ' dashboard-stat-card--negative-active' : ''}`}
          >
            <span className="dashboard-stat-card__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <p>{card.title}</p>
            <h3>{counts[card.key]}</h3>
            <span>{card.subtitle}</span>
          </Link>
        );
      })}
    </section>
  );
}
