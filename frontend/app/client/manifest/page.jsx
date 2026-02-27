'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ManifestUpload } from './ManifestUpload';

const OVERLAY_STYLE = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const MODAL_STYLE = {
  background: '#fff', borderRadius: '10px', padding: '28px 32px',
  width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
};
const FIELD_STYLE = {
  width: '100%', height: '36px', borderRadius: '6px',
  border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '14px',
  boxSizing: 'border-box',
};
const LABEL_STYLE = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' };
const FORM_ROW_STYLE = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' };

function FormField({ label, children }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

export default function ManifestEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('range');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [rowStatus, setRowStatus] = useState({});

  // CRUD state
  const [manifests, setManifests] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: null, entry: null });
  const [form, setForm] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [currentPage, searchTerm, startDate, endDate]);

  useEffect(() => {
    api.get('/api/manifests')
      .then(data => setManifests(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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

  // CRUD handlers
  function openCreateModal() {
    setForm({
      manifestId: manifests[0]?._id || '',
      name: '', phone: '', email: '',
      pickupDate: '', pickupTime: '',
      pickupAddress: '', dropoffAddress: '',
      status: 'Pending', extra: {},
    });
    setModalError('');
    setModal({ open: true, mode: 'create', entry: null });
  }

  function openEditModal(entry) {
    setForm({
      name: entry.name || '',
      phone: entry.phone || '',
      email: entry.email || '',
      pickupDate: entry.pickupDate ? String(entry.pickupDate).substring(0, 10) : '',
      pickupTime: entry.pickupTime || '',
      pickupAddress: entry.pickupAddress || '',
      dropoffAddress: entry.dropoffAddress || '',
      status: entry.status || 'Pending',
      extra: { ...(entry.extra || {}) },
    });
    setModalError('');
    setModal({ open: true, mode: 'edit', entry });
  }

  function closeModal() {
    setModal({ open: false, mode: null, entry: null });
    setModalError('');
    setModalLoading(false);
  }

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setExtraField(key, value) {
    setForm(prev => ({ ...prev, extra: { ...prev.extra, [key]: value } }));
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      if (modal.mode === 'create') {
        if (!form.manifestId) {
          setModalError('Please select a manifest.');
          setModalLoading(false);
          return;
        }
        await api.post('/api/manifests/entries', form);
      } else {
        await api.patch(`/api/manifests/entries/${modal.entry._id}`, form);
      }
      closeModal();
      fetchEntries();
    } catch (err) {
      setModalError(err?.message || 'An error occurred. Please try again.');
      setModalLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmId) return;
    setModalLoading(true);
    setModalError('');
    try {
      await api.delete(`/api/manifests/entries/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchEntries();
    } catch (err) {
      setModalError(err?.message || 'Failed to delete. Please try again.');
    } finally {
      setModalLoading(false);
    }
  }

  // Column derivation — new order
  const allExtraColumns = Array.from(new Set(entries.flatMap(e => Object.keys(e.extra || {})))).sort();
  const hasSegmentStatus = allExtraColumns.includes('SegmentStatusCode');
  const remainingExtras = allExtraColumns.filter(c => c !== 'SegmentStatusCode');
  // Actions(1) + [SegmentStatusCode?] + Name(1) + remainingExtras + Source(1)
  const totalCols = 3 + allExtraColumns.length;

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Manifest Entries</h1>
      </div>

      <ManifestUpload onUploadSuccess={handleUploadSuccess} />

      <div className="card" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="card__header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>All Manifest Entries</span>
          <button
            onClick={openCreateModal}
            style={{
              padding: '7px 16px', fontSize: '13px', fontWeight: '500',
              borderRadius: '6px', border: 'none',
              background: '#2563eb', color: '#fff', cursor: 'pointer',
            }}
          >
            + Add Entry
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, phone, email, address..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ paddingLeft: '36px', height: '40px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
              <button
                onClick={() => toggleFilterMode('single')}
                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: 'none', background: filterMode === 'single' ? '#fff' : 'transparent', color: filterMode === 'single' ? '#0f172a' : '#64748b', boxShadow: filterMode === 'single' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
              >Single Date</button>
              <button
                onClick={() => toggleFilterMode('range')}
                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: 'none', background: filterMode === 'range' ? '#fff' : 'transparent', color: filterMode === 'range' ? '#0f172a' : '#64748b', boxShadow: filterMode === 'range' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
              >Date Range</button>
            </div>

            {filterMode === 'single' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Date</label>
                <input type="date" value={startDate} onChange={(e) => handleDateChange('start', e.target.value)} style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>From</label>
                  <input type="date" value={startDate} onChange={(e) => handleDateChange('start', e.target.value)} style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>To</label>
                  <input type="date" value={endDate} onChange={(e) => handleDateChange('end', e.target.value)} style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px' }} />
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
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0', minWidth: '220px' }}>Actions</th>
                {hasSegmentStatus && (
                  <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>SegmentStatusCode</th>
                )}
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0', minWidth: '150px' }}>Passenger Name</th>
                {remainingExtras.map(col => (
                  <th key={col} style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{col}</th>
                ))}
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2e8f0', minWidth: '150px' }}>Source (Manifest)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalCols} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading entries...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No entries found. Upload a manifest or adjust filters.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const status = rowStatus[entry._id] || {};
                  const isSending = !!status.sending;
                  const isDeleting = deleteConfirmId === entry._id && modalLoading;
                  return (
                    <tr key={entry._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {/* Actions column — first */}
                      <td style={{ padding: '10px 16px' }}>
                        {status.error && (
                          <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '6px', maxWidth: '200px', whiteSpace: 'normal' }}>
                            {status.error}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Email */}
                          <button
                            onClick={() => handleSendReview(entry, 'email')}
                            disabled={isSending || !entry.email}
                            title={!entry.email ? 'No email on file' : 'Send review request via email'}
                            style={{
                              padding: '5px 10px', fontSize: '12px', borderRadius: '4px',
                              border: '1px solid #bfdbfe',
                              background: status.sent === 'email' ? '#dcfce7' : '#eff6ff',
                              color: status.sent === 'email' ? '#16a34a' : (!entry.email ? '#94a3b8' : '#1d4ed8'),
                              cursor: isSending || !entry.email ? 'not-allowed' : 'pointer',
                              opacity: !entry.email ? 0.5 : 1,
                              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            {status.sending === 'email' ? (
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : null}
                            {status.sent === 'email' ? '✓ Sent' : '📧 Email'}
                          </button>
                          {/* SMS */}
                          <button
                            onClick={() => handleSendReview(entry, 'sms')}
                            disabled={isSending || !entry.phone}
                            title={!entry.phone ? 'No phone on file' : 'Send review request via SMS'}
                            style={{
                              padding: '5px 10px', fontSize: '12px', borderRadius: '4px',
                              border: '1px solid #bbf7d0',
                              background: status.sent === 'sms' ? '#dcfce7' : '#f0fdf4',
                              color: status.sent === 'sms' ? '#16a34a' : (!entry.phone ? '#94a3b8' : '#15803d'),
                              cursor: isSending || !entry.phone ? 'not-allowed' : 'pointer',
                              opacity: !entry.phone ? 0.5 : 1,
                              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            {status.sending === 'sms' ? (
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #15803d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : null}
                            {status.sent === 'sms' ? '✓ Sent' : '📱 SMS'}
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(entry)}
                            disabled={isSending}
                            title="Edit entry"
                            style={{
                              padding: '5px 10px', fontSize: '12px', borderRadius: '4px',
                              border: '1px solid #cbd5e1', background: '#f8fafc', color: '#374151',
                              cursor: isSending ? 'not-allowed' : 'pointer',
                              opacity: isSending ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => { setDeleteConfirmId(entry._id); setModalError(''); }}
                            disabled={isSending || isDeleting}
                            title="Delete entry"
                            style={{
                              padding: '5px 10px', fontSize: '12px', borderRadius: '4px',
                              border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626',
                              cursor: isSending || isDeleting ? 'not-allowed' : 'pointer',
                              opacity: isSending ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                      {/* SegmentStatusCode (pinned) */}
                      {hasSegmentStatus && (
                        <td style={{ padding: '12px 16px' }}>{entry.extra?.SegmentStatusCode || ''}</td>
                      )}
                      {/* Passenger Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500' }}>{entry.name || 'Unknown'}</div>
                      </td>
                      {/* Remaining extra columns */}
                      {remainingExtras.map(col => (
                        <td key={col} style={{ padding: '12px 16px' }}>{entry.extra?.[col] || ''}</td>
                      ))}
                      {/* Source (Manifest) — last */}
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                        {entry.manifestId?.name || 'Unknown'}
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
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >Previous</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#475569' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >Next</button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div style={OVERLAY_STYLE} onClick={() => { if (!modalLoading) setDeleteConfirmId(null); }}>
          <div style={{ ...MODAL_STYLE, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Delete Entry</h2>
            <p style={{ margin: '0 0 20px', color: '#4b5563', fontSize: '14px' }}>
              Are you sure you want to delete this entry? This action cannot be undone and will also remove any associated review requests.
            </p>
            {modalError && (
              <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                {modalError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={modalLoading}
                style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={modalLoading}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: modalLoading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: modalLoading ? 0.7 : 1 }}
              >
                {modalLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal.open && (
        <div style={OVERLAY_STYLE} onClick={() => { if (!modalLoading) closeModal(); }}>
          <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {modal.mode === 'create' ? 'Add Entry' : 'Edit Entry'}
            </h2>

            <form onSubmit={handleModalSubmit}>
              {/* Manifest selector (create) or label (edit) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={LABEL_STYLE}>Manifest {modal.mode === 'create' && <span style={{ color: '#dc2626' }}>*</span>}</label>
                {modal.mode === 'create' ? (
                  <select
                    value={form.manifestId || ''}
                    onChange={e => setField('manifestId', e.target.value)}
                    style={{ ...FIELD_STYLE }}
                    required
                  >
                    <option value="">— Select manifest —</option>
                    {manifests.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ ...FIELD_STYLE, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    {modal.entry?.manifestId?.name || 'Unknown'}
                  </div>
                )}
              </div>

              <div style={FORM_ROW_STYLE}>
                <FormField label="Passenger Name">
                  <input type="text" value={form.name || ''} onChange={e => setField('name', e.target.value)} style={FIELD_STYLE} placeholder="Full name" />
                </FormField>
                <FormField label="Phone">
                  <input type="text" value={form.phone || ''} onChange={e => setField('phone', e.target.value)} style={FIELD_STYLE} placeholder="+1 555 000 0000" />
                </FormField>
              </div>

              <div style={FORM_ROW_STYLE}>
                <FormField label="Email">
                  <input type="email" value={form.email || ''} onChange={e => setField('email', e.target.value)} style={FIELD_STYLE} placeholder="email@example.com" />
                </FormField>
                <FormField label="Status">
                  <input type="text" value={form.status || ''} onChange={e => setField('status', e.target.value)} style={FIELD_STYLE} placeholder="Pending" />
                </FormField>
              </div>

              <div style={FORM_ROW_STYLE}>
                <FormField label="Pickup Date">
                  <input type="date" value={form.pickupDate || ''} onChange={e => setField('pickupDate', e.target.value)} style={FIELD_STYLE} />
                </FormField>
                <FormField label="Pickup Time">
                  <input type="text" value={form.pickupTime || ''} onChange={e => setField('pickupTime', e.target.value)} style={FIELD_STYLE} placeholder="e.g. 08:30 AM" />
                </FormField>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <FormField label="Pickup Address">
                  <input type="text" value={form.pickupAddress || ''} onChange={e => setField('pickupAddress', e.target.value)} style={FIELD_STYLE} placeholder="123 Main St" />
                </FormField>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <FormField label="Dropoff Address">
                  <input type="text" value={form.dropoffAddress || ''} onChange={e => setField('dropoffAddress', e.target.value)} style={FIELD_STYLE} placeholder="456 Oak Ave" />
                </FormField>
              </div>

              {/* Extra fields (edit mode only) */}
              {modal.mode === 'edit' && Object.keys(form.extra || {}).length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
                    Additional Fields
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.keys(form.extra).map(key => (
                      <FormField key={key} label={key}>
                        <input
                          type="text"
                          value={form.extra[key] || ''}
                          onChange={e => setExtraField(key, e.target.value)}
                          style={FIELD_STYLE}
                        />
                      </FormField>
                    ))}
                  </div>
                </div>
              )}

              {modalError && (
                <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  {modalError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={modalLoading}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', cursor: modalLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', opacity: modalLoading ? 0.7 : 1 }}
                >
                  {modalLoading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
