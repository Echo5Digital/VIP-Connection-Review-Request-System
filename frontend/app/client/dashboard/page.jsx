import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ClientDashboardPage() {
  const quickNav = [
    { label: 'Trips', href: '/client/manifest', icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>, color: 'bg-green-100 text-green-700' },
    { label: 'Drivers', href: '/client/drivers', icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" /><rect x="2" y="13" width="20" height="6" rx="2" /><circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></svg>, color: 'bg-blue-100 text-blue-700' },
    { label: 'Feedback', href: '/client/feedback', icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="admin-dashboard p-12 max-w-4xl mx-auto" style={{ padding: '48px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1a5c38', marginBottom: '1rem', fontWeight: 800 }}>Welcome Back</h1>
        <p style={{ color: '#666', fontSize: '1.2rem' }}>
          Choose a module below to manage your review request system.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
        {quickNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              padding: '40px 32px',
              textDecoration: 'none',
              borderRadius: '24px',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{
              padding: '24px',
              borderRadius: '20px',
              background: item.color.split(' ')[0] === 'bg-green-100' ? '#dcfce7' :
                item.color.split(' ')[0] === 'bg-blue-100' ? '#dbeafe' : '#ffedd5',
              color: item.color.split(' ')[1] === 'text-green-700' ? '#15803d' :
                item.color.split(' ')[1] === 'text-blue-700' ? '#1d4ed8' : '#c2410c'
            }}>
              {item.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gray-800)', marginBottom: '4px' }}>{item.label}</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>Manage your {item.label.toLowerCase()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
