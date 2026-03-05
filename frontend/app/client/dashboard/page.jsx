import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ClientDashboardPage = () => {
  const quickNav = [
    { label: 'Trips', href: '/client/manifest', icon: '🚗', description: 'Manage your review requests and trip logs' },
    { label: 'Drivers', href: '/client/drivers', icon: '👤', description: 'View and manage driver information' },
    { label: 'Feedback', href: '/client/feedback', icon: '💬', description: 'Monitor customer reviews and feedback' },
  ];

  return (
    <div className="dashboard-container" style={{ padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: 800 }}>Welcome Back</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Choose a module below to manage your review request system and monitor fleet performance.
        </p>
      </div>

      <div className="widget-grid widget-grid-3" style={{ maxWidth: '1100px', margin: '0 auto', gap: '24px' }}>
        {quickNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="card"
            style={{
              padding: '48px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              border: '1px solid var(--border-dim)'
            }}
          >
            <div style={{
              fontSize: '40px',
              background: 'rgba(201, 162, 74, 0.1)',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '20px',
              marginBottom: '28px',
              color: 'var(--accent)',
              border: '1px solid rgba(201, 162, 74, 0.2)'
            }}>
              {item.icon}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>{item.label}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>{item.description}</p>
            <div className="text-accent" style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Open Module
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ClientDashboardPage;
