import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/server-api';

function fmt(val) {
  return val ?? '—';
}

export default async function ManifestDetailPage({ params }) {
  const { id } = await params;
  let data = null;
  try {
    data = await serverApi.get(`/api/manifests/${id}`);
  } catch {
    notFound();
  }
  const { name, contacts } = data;

  return (
    <div>
      <div className="flex-center mb-6" style={{ gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/admin/manifest" className="text-muted text-sm" style={{ textDecoration: 'none' }}>
          ← Manifests
        </Link>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{name}</h1>
        <span style={{ flex: 1 }} />
        <Link href={`/admin/send-review?manifestId=${id}`} className="btn btn--primary btn--sm">
          Send review to this manifest
        </Link>
      </div>

      <p className="text-muted text-sm mb-4">{contacts.length} contact(s)</p>

      <div className="card">
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1200px' }}>
            <thead>
              <tr>
                <th>Pickup Date/Time</th>
                <th>Res #</th>
                <th>Customer</th>
                <th>Passenger</th>
                <th>Cell Phone</th>
                <th>Email</th>
                <th>Pickup Address</th>
                <th>Dropoff Address</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const ex = c.extra || {};
                const passengerName = c.name
                  || [ex.PassengerFirstName, ex.PassengerLastName].filter(Boolean).join(' ')
                  || '—';
                return (
                  <tr key={c._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(ex.PickupDateTime)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(ex.ResNumber)}</td>
                    <td>{fmt(ex.CustomerName)}</td>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{passengerName}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.phone || fmt(ex.PassengerCellPhoneNumber)}</td>
                    <td>{c.email || fmt(ex.PassengerEmailAddress)}</td>
                    <td>{fmt(ex['Pickup Address'])}</td>
                    <td>{fmt(ex['Dropoff Address'])}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(ex.DispatchDriverName)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(ex.DispatchVehicleTypeCode)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(ex.SegementStatusCode)}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{fmt(ex.SegmentTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
