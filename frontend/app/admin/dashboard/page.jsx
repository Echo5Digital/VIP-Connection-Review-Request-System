import { Suspense } from 'react';
import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import { FunnelMetricsWidget, ConversionMetricsWidget, DriverPerformanceWidget, VehiclePerformanceWidget, NegativeFeedbackWidget } from './analytics-widgets';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [analyticsData] = await Promise.all([
    serverApi.get('/api/dashboard/analytics').catch(() => null),
  ]);

  const fallbackAnalytics = {
    funnel: { requestsSent: 0, delivered: 0, ratingsSubmitted: 0, fiveStarDriverVehicle: 0, publicReviewClicks: 0, privateFeedback: 0 },
    conversion: { sentRateConversion: 0, clickConversion: 0 },
    drivers: { topDrivers: [], attentionDrivers: [] },
    vehicles: [],
    negativeFeedback: { total: 0, days_0_2: 0, days_3_7: 0, days_8_plus: 0 }
  };

  const analytics = analyticsData || fallbackAnalytics;

  const quickNav = [
    { label: 'Trips', href: '/admin/manifest', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>, color: 'bg-green-100 text-green-700' },
    { label: 'Drivers', href: '/admin/drivers', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" /><rect x="2" y="13" width="20" height="6" rx="2" /><circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></svg>, color: 'bg-blue-100 text-blue-700' },
    { label: 'Feedback', href: '/admin/feedback', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, color: 'bg-orange-100 text-orange-700' },
    { label: 'Users', href: '/admin/clients', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="admin-dashboard p-6 space-y-6">
      {/* Quick Navigation Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {quickNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              textDecoration: 'none',
              marginBottom: 0,
              transition: 'all 0.2s',
              border: '1px solid var(--gray-200)'
            }}
          >
            <div style={{
              padding: '10px',
              borderRadius: '10px',
              background: item.color.split(' ')[0] === 'bg-green-100' ? '#dcfce7' :
                item.color.split(' ')[0] === 'bg-blue-100' ? '#dbe afe' :
                  item.color.split(' ')[0] === 'bg-purple-100' ? '#f3e8ff' : '#ffedd5',
              color: item.color.split(' ')[1] === 'text-green-700' ? '#15803d' :
                item.color.split(' ')[1] === 'text-blue-700' ? '#1d4ed8' :
                  item.color.split(' ')[1] === 'text-purple-700' ? '#7e22ce' : '#c2410c'
            }}>
              {item.icon}
            </div>
            <span style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '15px' }}>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="dashboard-row">
        <div className="dashboard-col-2">
          <FunnelMetricsWidget data={analytics.funnel} />
        </div>
        <div className="dashboard-col-1">
          <ConversionMetricsWidget data={analytics.conversion} />
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-col-2">
          <DriverPerformanceWidget data={analytics.drivers} />
        </div>
        <div className="dashboard-col-1">
          <VehiclePerformanceWidget data={analytics.vehicles} />
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-col-full">
          <NegativeFeedbackWidget data={analytics.negativeFeedback} />
        </div>
      </div>
    </div>
  );
}
