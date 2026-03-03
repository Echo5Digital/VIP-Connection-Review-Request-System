import { serverApi } from '@/lib/server-api';
import ClientDashboardCards from './stats-cards';
import FeedbackTrendGraph from '@/components/FeedbackTrendGraph';

const cards = [
  { title: 'Review Request', key: 'files', subtitle: 'Uploaded files', href: '/client/manifest', primary: true },
  { title: 'Drivers', key: 'drivers', subtitle: 'Driver records', href: '/client/drivers' },
  { title: 'Feedback', key: 'feedback', subtitle: 'Total responses', href: '/client/feedback' },
  { title: 'Negative Feedback', key: 'negative', subtitle: 'Needs attention', href: '/client/feedback?filter=negative', negative: true },
];

export default async function ClientDashboardPage() {
  const [entriesData, driversData, feedbackData, negativeFeedbackData] = await Promise.all([
    serverApi.get('/api/manifests/entries?page=1&limit=1').catch(() => ({ pagination: { total: 0 } })),
    serverApi.get('/api/drivers').catch(() => ({ total: 0 })),
    serverApi.get('/api/feedback').catch(() => ({ pagination: { total: 0 } })),
    serverApi.get('/api/feedback?filter=negative&limit=1').catch(() => ({ pagination: { total: 0 } })),
  ]);

  const counts = {
    files: entriesData?.pagination?.total || 0,
    drivers: driversData?.total || 0,
    feedback: feedbackData?.pagination?.total || 0,
    negative: negativeFeedbackData?.pagination?.total || 0,
  };

  return (
    <div className="admin-dashboard">
      <ClientDashboardCards cards={cards} counts={counts} />
      <FeedbackTrendGraph />
    </div>
  );
}
