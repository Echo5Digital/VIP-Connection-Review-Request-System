'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPickupDateTime, formatPickupDateTimeFromParts } from '@/lib/pickupDateTime';
import { useStaffContext } from '../../StaffContext';

function fmt(val) {
  return val ?? '—';
}

const REQUIRED_COLUMNS = [
  'PickupDateTime', 'ResNumber', 'CustomerCode', 'CustomerName',
  'PassengerCellPhoneNumber', 'PassengerEmailAddress', 'PassengerFirstName', 'PassengerLastName',
  'PickupAddress', 'PickupPricingZone', 'DropoffPricingZone', 'DropoffAddress',
  'DispatchDriverCode', 'DispatchDriverName', 'DispatchVehicleCode', 'DispatchDriverPhoneNumber',
  'DispatchVehicleTypeCode', 'OnLocationDateTime', 'PassengerOnBoardDateTime',
  'SegmentStatusCode', 'SegmentTotal',
  'ContactEmailAddress', 'ContactFirstName', 'ContactLastName', 'ContactPhoneNumber'
];

export default function ManifestDetailPage() {
  const router = useRouter();
  const { user: staffUser, loading: ctxLoading } = useStaffContext();
  const params = useParams();
  const id = params.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    if (!ctxLoading && staffUser?.role === 'manager') {
      router.replace('/staff/dashboard');
    }
  }, [staffUser, ctxLoading]);

  useEffect(() => {
    if (id && !ctxLoading && staffUser?.role !== 'manager') {
      fetchManifest();
    }
  }, [id, ctxLoading, staffUser]);

  async function fetchManifest() {
    try {
      setLoading(true);
      const res = await api.get(`/api/manifests/${id}`);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch manifest', err);
      setError(err instanceof Error ? err.message : 'Manifest not found');
    } finally {
      setLoading(false);
    }
  }

  if (ctxLoading || staffUser?.role === 'manager') return null;
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading manifest details...</div>;
  if (error || !data) return notFound();

  const { name, contacts, columns } = data;

  const displayColumns = columns && columns.length > 0 ? columns : [];

  const sortedColumns = [...displayColumns].sort((a, b) => {
    const aIdx = REQUIRED_COLUMNS.indexOf(a);
    const bIdx = REQUIRED_COLUMNS.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  const totalPages = Math.ceil(contacts.length / limit);
  const paginatedContacts = contacts.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link
          href="/staff/manifest"
          className="btn btn--outline btn--sm"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Manifests
        </Link>
        <h1 className="page-title" style={{ margin: 0 }}>{name}</h1>
        <div style={{ flex: 1 }} />
      </div>

      <div className="card">
        <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Manifest Contacts</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '2px 10px', borderRadius: '12px' }}>
            {contacts.length} Contact(s)
          </span>
        </div>

        <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ minWidth: sortedColumns.length > 5 ? '1500px' : 'auto' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '150px', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10 }}>Mapped Passenger</th>
                <th style={{ minWidth: '150px' }}>Mapped Phone</th>
                <th style={{ minWidth: '200px' }}>Mapped Email</th>
                {sortedColumns.map(col => (
                  <th key={col} style={{ minWidth: '150px' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedContacts.map((c) => {
                const ex = c.extra || {};
                return (
                  <tr key={c._id}>
                    <td style={{
                      fontWeight: 600,
                      color: 'var(--blue-700)',
                      position: 'sticky',
                      left: 0,
                      background: '#fff',
                      zIndex: 1,
                      boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                    }}>{fmt(c.name)}</td>
                    <td>{fmt(c.phone)}</td>
                    <td>{fmt(c.email)}</td>
                    {sortedColumns.map(col => {
                      const val = ex[col];
                      const isPickupDateTime = col === 'PickupDateTime' || col === 'Pickup Date Time';
                      const displayValue = isPickupDateTime
                        ? (formatPickupDateTimeFromParts(c.pickupDate, c.pickupTime) || formatPickupDateTime(val))
                        : val;
                      const isStatus = col === 'SegmentStatusCode' || col === 'Segment Status Code' || col === 'SegmentStatusCode';
                      const isTotal = col === 'SegmentTotal' || col === 'Segment Total';

                      if (isStatus) {
                        return (
                          <td key={col}>
                            <span className={`badge ${val === 'Done' ? 'badge--green' : 'badge--yellow'}`}>
                              {fmt(displayValue)}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={col} style={{
                          whiteSpace: 'nowrap',
                          fontWeight: isTotal ? 600 : 400,
                          textAlign: isTotal ? 'right' : 'left'
                        }}>
                          {fmt(displayValue)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--gray-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            background: '#fff'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
              Showing <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{(currentPage - 1) * limit + 1}</span> to <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{Math.min(currentPage * limit, contacts.length)}</span> of <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{contacts.length}</span> contacts
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="btn btn--sm btn--outline"
                style={{ borderRadius: '6px', minWidth: '80px' }}
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: currentPage === pageNum ? 'var(--blue-600)' : 'var(--gray-200)',
                          background: currentPage === pageNum ? 'var(--blue-600)' : 'transparent',
                          color: currentPage === pageNum ? '#fff' : 'var(--gray-700)',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} style={{ padding: '0 4px', color: 'var(--gray-400)' }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="btn btn--sm btn--outline"
                style={{ borderRadius: '6px', minWidth: '80px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
