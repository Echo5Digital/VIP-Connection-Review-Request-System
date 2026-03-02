'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/admin/manifest', label: 'Review Request' },
  { href: '/admin/drivers', label: 'Drivers' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/feedback', label: 'Feedback' },
];

export default function DashboardTabs() {
  const pathname = usePathname();
  const activePath = pathname?.startsWith('/admin/dashboard') ? '/admin/manifest' : pathname;

  return (
    <div className="admin-dashboard__tabs">
      {tabs.map((tab) => {
        const isActive = activePath === tab.href || activePath?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-dashboard__tab${isActive ? ' admin-dashboard__tab--active' : ''}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
