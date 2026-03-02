import Link from 'next/link';
import { serverApi } from '@/lib/server-api';

const cards = [
  { title: 'Review Request', key: 'files', subtitle: 'Uploaded files', href: '/client/manifest', primary: true },
  { title: 'Drivers', key: 'drivers', subtitle: 'Driver records', href: '/client/drivers' },
  { title: 'Clients', key: 'clients', subtitle: 'Portal clients', href: '/client/clients' },
  { title: 'Feedback', key: 'feedback', subtitle: 'Total responses', href: '/client/feedback' },
  { title: 'Negative Feedback', key: 'negative', subtitle: 'Needs attention', href: '/client/feedback?filter=negative', negative: true },
];

export default async function ClientDashboardPage() {
  const [manifestFilesData, clientsData, driversData, feedbackData, negativeFeedbackData] = await Promise.all([
    serverApi.get('/api/manifests/count').catch(() => ({ total: 0 })),
    serverApi.get('/api/clients').catch(() => []),
    serverApi.get('/api/drivers').catch(() => ({ total: 0 })),
    serverApi.get('/api/feedback').catch(() => ({ pagination: { total: 0 } })),
    serverApi.get('/api/feedback?filter=negative&limit=1').catch(() => ({ pagination: { total: 0 } })),
  ]);

  const counts = {
    files: manifestFilesData?.total || 0,
    clients: Array.isArray(clientsData) ? clientsData.length : 0,
    drivers: driversData?.total || 0,
    feedback: feedbackData?.pagination?.total || 0,
    negative: negativeFeedbackData?.pagination?.total || 0,
  };

  return (
    <div className="admin-dashboard">
      <section className="dashboard-stats" aria-label="Dashboard summary cards">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`dashboard-stat-card${card.primary ? ' dashboard-stat-card--primary' : ''}${card.negative ? ' dashboard-stat-card--negative' : ''}`}
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
        ))}
      </section>
    </div>
  );
}
