'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ManifestUpload } from './ManifestUpload';

export default function ManifestEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('range'); // 'single' | 'range'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Track per-row send state: { [contactId]: { sending: 'email'|'sms'|null, sent: 'email'|'sms'|null, error: string|null } }
  const [rowStatus, setRowStatus] = useState({});

  useEffect(() => {
    fetchEntries();
  }, [currentPage, searchTerm, startDate, endDate]);

  async function fetchEntries() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        sortBy: 'pickupDate',
        order: 'asc'
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const data = await api.get(`/api/manifests/entries?${params.toString()}`);
      setEntries(data.contacts || []);
      setTotalPages(data.pagination.pages || 1);
    } catch (err) {
      console.error('Failed to fetch manifest entries', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  function handleDateChange(type, value) {
    if (filterMode === 'single') {
        setStartDate(value);
        setEndDate(value);
    } else {
        if (type === 'start') setStartDate(value);
        else setEndDate(value);
    }
    setCurrentPage(1);
  }

  function toggleFilterMode(mode) {
      setFilterMode(mode);
      setStartDate('');
      setEndDate('');
      setCurrentPage(1);
  }

  function handleUploadSuccess() {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchEntries();
  }

  async function handleSendReview(entry, channel) {
    const id = entry._id;
    setRowStatus(prev => ({ ...prev, [id]: { sending: channel, sent: null, error: null } }));
    try {
      await api.post('/api/review-requests/send', { contactId: id, channel });
      setRowStatus(prev => ({ ...prev, [id]: { sending: null, sent: channel, error: null } }));
    } catch (err) {
      const msg = err?.message || 'Failed to send. Please try again.';
      setRowStatus(prev => ({ ...prev, [id]: { sending: null, sent: null, error: msg } }));
    }
  }

  // Calculate dynamic columns from the current page of entries
  const extraColumns = Array.from(new Set(entries.flatMap(e => Object.keys(e.extra || {})))).sort();

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Manifest Entries</h1>
      </div>

      <ManifestUpload onUploadSuccess={handleUploadSuccess} />

      <div className="card" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="card__header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>
          All Manifest Entries
        </div>

        {/* Filters Section */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, phone, email, address..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                paddingLeft: '36px',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                width: '100%'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                <button
                    onClick={() => toggleFilterMode('single')}
                    style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: filterMode === 'single' ? '#fff' : 'transparent',
                        color: filterMode === 'single' ? '#0f172a' : '#64748b',
                        boxShadow: filterMode === 'single' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Single Date
                </button>
                <button
                    onClick={() => toggleFilterMode('range')}
                    style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: filterMode === 'range' ? '#fff' : 'transparent',
                        color: filterMode === 'range' ? '#0f172a' : '#64748b',
                        boxShadow: filterMode === 'range' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Date Range
                </button>
            </div>

            {filterMode === 'single' ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px' }}
                    />
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>From</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px' }}
                    />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>To</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange('end', e.target.value)}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px' }}
                    />
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0', minWidth: '150px' }}>Source (Manifest)</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0', minWidth: '150px' }}>Passenger Name</th>
                {extraColumns.map(col => (
                  <th key={col} style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>
                    {col}
                  </th>
                ))}
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3 + extraColumns.length} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading entries...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={3 + extraColumns.length} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No entries found. Upload a manifest or adjust filters.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const status = rowStatus[entry._id] || {};
                  const isSending = !!status.sending;
                  return (
                    <tr key={entry._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                        {entry.manifestId?.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500' }}>{entry.name || 'Unknown'}</div>
                      </td>
                      {extraColumns.map(col => (
                        <td key={col} style={{ padding: '12px 16px' }}>
                          {entry.extra?.[col] || ''}
                        </td>
                      ))}
                      <td style={{ padding: '12px 16px' }}>
                        {status.error && (
                          <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '6px', maxWidth: '180px', whiteSpace: 'normal' }}>
                            {status.error}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleSendReview(entry, 'email')}
                            disabled={isSending || !entry.email}
                            title={!entry.email ? 'No email on file' : 'Send review request via email'}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: '1px solid #bfdbfe',
                              background: status.sent === 'email' ? '#dcfce7' : '#eff6ff',
                              color: status.sent === 'email' ? '#16a34a' : (!entry.email ? '#94a3b8' : '#1d4ed8'),
                              cursor: isSending || !entry.email ? 'not-allowed' : 'pointer',
                              opacity: !entry.email ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {status.sending === 'email' ? (
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : null}
                            {status.sent === 'email' ? '✓ Sent' : '📧 Email'}
                          </button>
                          <button
                            onClick={() => handleSendReview(entry, 'sms')}
                            disabled={isSending || !entry.phone}
                            title={!entry.phone ? 'No phone on file' : 'Send review request via SMS'}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: '1px solid #bbf7d0',
                              background: status.sent === 'sms' ? '#dcfce7' : '#f0fdf4',
                              color: status.sent === 'sms' ? '#16a34a' : (!entry.phone ? '#94a3b8' : '#15803d'),
                              cursor: isSending || !entry.phone ? 'not-allowed' : 'pointer',
                              opacity: !entry.phone ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {status.sending === 'sms' ? (
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #15803d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : null}
                            {status.sent === 'sms' ? '✓ Sent' : '📱 SMS'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f1f5f9' : '#fff',
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#475569' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f1f5f9' : '#fff',
                color: currentPage === totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
