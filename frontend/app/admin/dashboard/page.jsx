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
    { label: 'Trips', href: '/admin/manifest', icon: '🚗' },
    { label: 'Drivers', href: '/admin/drivers', icon: '👤' },
    { label: 'Feedback', href: '/admin/feedback', icon: '💬' },
    { label: 'Users', href: '/admin/clients', icon: '👥' },
  ];

  return (
    <div className="dashboard-container">
      {/* Quick Navigation */}
      <div className="widget-grid widget-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {quickNav.map((item) => (
          <Link key={item.href} href={item.href} className="card stat-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', marginBottom: 0 }}>
            <div style={{ fontSize: '24px', background: 'rgba(201, 162, 74, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>{item.icon}</div>
            <div>
              <div className="stat-card__label" style={{ marginBottom: '2px', color: 'var(--text-main)', fontWeight: '500' }}>{item.label}</div>
              <div className="text-accent" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>Manage →</div>
            </div>
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
        <div className="dashboard-col-full">
          <NegativeFeedbackWidget data={analytics.negativeFeedback} />
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-col-1">
          <DriverPerformanceWidget data={analytics.drivers} />
        </div>
        <div className="dashboard-col-1">
          <VehiclePerformanceWidget data={analytics.vehicles} />
        </div>
      </div>
    </div>
  );
}
