import { Suspense } from 'react';
import { serverApi } from '@/lib/server-api';
import AdminDashboardCards from './stats-cards';
import FeedbackTrendGraph from '@/components/FeedbackTrendGraph';

export const dynamic = 'force-dynamic';

const cards = [
  { title: 'Review Request', key: 'files', subtitle: 'Uploaded files', href: '/admin/manifest', primary: true },
  { title: 'Drivers', key: 'drivers', subtitle: 'Driver records', href: '/admin/drivers' },
  { title: 'Clients', key: 'clients', subtitle: 'Portal clients', href: '/admin/clients' },
  { title: 'Negative Feedback', key: 'negative', subtitle: 'Needs attention', href: '/admin/feedback?filter=negative', negative: true },
];

export default async function DashboardPage() {
  const [entriesData, clientsData, driversData, negativeFeedbackData] = await Promise.all([
    serverApi.get('/api/manifests/entries?page=1&limit=1').catch(() => ({ pagination: { total: 0 } })),
    serverApi.get('/api/clients').catch(() => []),
    serverApi.get('/api/drivers').catch(() => ({ total: 0 })),
    serverApi.get('/api/feedback?filter=negative&limit=1').catch(() => ({ pagination: { total: 0 } })),
  ]);

  const counts = {
    files: entriesData?.pagination?.total || 0,
    clients: Array.isArray(clientsData) ? clientsData.length : 0,
    drivers: driversData?.total || 0,
    negative: negativeFeedbackData?.pagination?.total || 0,
  };

  return (
    <div className="admin-dashboard">
      <Suspense fallback={null}>
        <AdminDashboardCards cards={cards} counts={counts} />
      </Suspense>
      <FeedbackTrendGraph />
    </div>
  );
}
