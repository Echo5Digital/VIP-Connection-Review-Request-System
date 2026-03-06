'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ManifestUpload } from '@/app/admin/manifest/ManifestUpload';
import { formatPickupDateTime, formatPickupDateTimeFromParts } from '@/lib/pickupDateTime';

const OVERLAY_STYLE = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  backdropFilter: 'blur(8px)',
};
const MODAL_STYLE = {
  background: 'var(--bg-surface)', borderRadius: '10px', padding: '24px',
  width: '100%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto',
  border: '1px solid var(--border-dim)',
  boxShadow: 'var(--shadow-lg)',
};
const FIELD_STYLE = {
  width: '100%', height: '36px', borderRadius: '6px',
  border: '1px solid var(--border-dim)', padding: '0 10px', fontSize: '14px',
  boxSizing: 'border-box',
  background: '#141414',
  color: 'var(--text-main)',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};
const LABEL_STYLE = { display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' };
const FORM_FIELD_WRAP_STYLE = { marginBottom: '16px' };

const REQUIRED_REVIEW_FIELDS = [
  'ResNumber',
  'PickupDateTime',
  'PassengerName',
  'PassengerCellPhoneNumber',
  'PassengerEmailAddress',
  'PassengerFirstName',
  'PassengerLastName',
  'DispatchDriverCode',
  'DispatchDriverName',
  'DispatchVehicleCode',
  'DispatchDriverPhoneNumber',
  'DispatchVehicleTypeCode',
];
const SEGMENT_STATUS_OPTIONS = ['PASSN', 'AFF-D', 'RIP', 'COMP'];

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function getMissingRequiredFields(entry) {
  const extra = entry?.extra || {};

  // Determine trip type — Affiliate trips don't require dispatch driver/vehicle fields
  const isAffiliate = extra.TripType === 'Affiliate' || extra.SegmentStatusCode === 'AFF-D';

  // Determine if this is an Assigned (pre-dispatch) trip — accept Assigned* fields as substitutes
  const isAssigned = extra.Status === 'Assigned' || entry?.status === 'Assigned';

  const valueByField = {
    ResNumber: extra.ResNumber || entry?.resNumber,
    PickupDateTime: extra.PickupDateTime || ((entry?.pickupDate || entry?.pickupTime) ? `${entry?.pickupDate || ''}${entry?.pickupTime || ''}` : ''),
    PassengerName: entry?.name || extra.PassengerName,
    PassengerCellPhoneNumber: extra.PassengerCellPhoneNumber || extra.PassngerCellPhoneNumber || entry?.phone,
    PassengerEmailAddress: extra.PassengerEmailAddress || extra['Passenger Email Address'],
    PassengerFirstName: extra.PassengerFirstName,
    PassengerLastName: extra.PassengerLastName,
    // Dispatch/driver fields: skipped for Affiliate trips; accept Assigned* fields for Assigned status
    DispatchDriverCode: isAffiliate
      ? '__SKIP__'
      : (extra.DispatchDriverCode || (isAssigned ? extra.AssignedDriverCode : '')),
    DispatchDriverName: isAffiliate
      ? '__SKIP__'
      : (extra.DispatchDriverName || (isAssigned ? extra.AssignedDriverName : '')),
    DispatchVehicleCode: isAffiliate
      ? '__SKIP__'
      : extra.DispatchVehicleCode,
    DispatchDriverPhoneNumber: isAffiliate
      ? '__SKIP__'
      : (extra.DispatchDriverPhoneNumber || (isAssigned ? extra.AssignedDriverPhoneNumber : '')),
    // Vehicle type: accept RequestedVehicleType variants for Affiliate trips
    DispatchVehicleTypeCode: extra.DispatchVehicleTypeCode || extra.RequestedVehicleType || extra.RequestedVehicleTypeCode,
  };

  return REQUIRED_REVIEW_FIELDS.filter((field) => {
    const v = valueByField[field];
    if (v === '__SKIP__') return false; // Not required for this trip type
    return !hasValue(v);
  });
}

function getEmptyForm(defaultManifestId = '') {
  return {
    manifestId: defaultManifestId,
    name: '',
    phone: '',
    email: '',
    pickupDate: '',
    pickupTime: '',
    pickupAddress: '',
    dropoffAddress: '',
    status: 'Pending',
    passengerFirstName: '',
    passengerLastName: '',
    resNumber: '',
    customerCode: '',
    customerName: '',
    pickupPricingZone: '',
    dropoffPricingZone: '',
    dispatchDriverCode: '',
    dispatchDriverName: '',
    dispatchVehicleCode: '',
    dispatchDriverPhoneNumber: '',
    dispatchVehicleTypeCode: '',
    onLocationDateTime: '',
    passengerOnBoardDateTime: '',
    segmentStatusCode: '',
    segmentTotal: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmailAddress: '',
    contactPhoneNumber: '',
    extra: {},
  };
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

export default function ManifestEntriesView({ role = 'admin' }) {
  const isAdmin = role === 'admin';
  const [isActiveDispatcher, setIsActiveDispatcher] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [rowStatus, setRowStatus] = useState({});

  // CRUD state
  const [manifests, setManifests] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: null, entry: null });
  const [form, setForm] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [alertModal, setAlertModal] = useState({ open: false, message: '' });
  const [missingTooltip, setMissingTooltip] = useState({ open: false, fields: [], top: 0, left: 0 });
  const tableWrapRef = useRef(null);
  const entryFormRef = useRef(null);
  const selectAllRef = useRef(null);

  useEffect(() => {
    fetchEntries();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (isAdmin) {
      setIsActiveDispatcher(false);
      return;
    }
    api.get('/api/auth/me')
      .then((data) => setIsActiveDispatcher(data?.user?.active === true && data?.user?.role === 'dispatcher'))
      .catch(() => setIsActiveDispatcher(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!(isAdmin || isActiveDispatcher)) return;
    api.get('/api/manifests')
      .then(data => setManifests(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, [isAdmin, isActiveDispatcher]);

  const canManageEntries = isAdmin || isActiveDispatcher || role === 'staff';
  const canUpload = true;

  async function fetchEntries() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        sortBy: 'pickupDate',
        order: 'desc'
      });
      const data = await api.get(`/api/manifests/entries?${params.toString()}`);
      setEntries(data.contacts || []);
      setTotalPages(data.pagination.pages || 1);
      setSelectedIds(new Set());
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

  function changePage(nextPage) {
    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      document.querySelector('.admin-shell__main')?.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  function handleUploadSuccess() {
    setSearchTerm('');
    setCurrentPage(1);
    fetchEntries();
  }

  function getEntryPrimaryKey(entry) {
    return entry?._id || entry?.extra?.ResNumber || entry?.resNumber;
  }

  function getEntryReactKey(entry, index) {
    // React keys must be unique among siblings; prefer DB id to avoid collisions.
    return entry?._id || `${entry?.extra?.ResNumber || entry?.resNumber || 'entry'}-${index}`;
  }

  async function handleSendReview(entry, channel) {
    if (!canManageEntries) {
      setAlertModal({ open: true, message: 'Only admin or active clients can send review requests.' });
      return;
    }
    if (channel === 'sms') {
      setAlertModal({ open: true, message: 'SMS service is currently unavailable.' });
      return;
    }
    const key = getEntryPrimaryKey(entry);
    setRowStatus(prev => ({ ...prev, [key]: { sending: channel, sent: null, error: null, info: null } }));
    try {
      await api.post('/api/review-requests/send', { contactId: entry._id, channel });
      const info = channel === 'email' ? 'Sent Successfully' : null;
      setRowStatus(prev => ({ ...prev, [key]: { sending: null, sent: channel, error: null, info } }));
    } catch (err) {
      console.error('Error sending review request:', err);
      setRowStatus(prev => ({ ...prev, [key]: { sending: null, sent: null, error: err?.message || 'Failed to Send', info: null } }));
    }
  }

  // CRUD handlers
  function scrollToEntryForm() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function openCreateModal() {
    if (!canManageEntries) return;
    setForm(getEmptyForm(manifests[0]?._id || ''));
    setModalError('');
    setModal({ open: true, mode: 'create', entry: null });
    scrollToEntryForm();
  }

  function openEditModal(entry) {
    if (!canManageEntries) return;
    const ex = entry.extra || {};
    setForm({
      name: entry.name || '',
      phone: entry.phone || '',
      email: entry.email || '',
      pickupDate: entry.pickupDate ? String(entry.pickupDate).substring(0, 10) : '',
      pickupTime: entry.pickupTime || '',
      pickupAddress: entry.pickupAddress || '',
      dropoffAddress: entry.dropoffAddress || '',
      status: entry.status || 'Pending',

      // Map extra fields to top-level form state for editing convenience, 
      // or keep them in 'extra' if we want to save them back to 'extra'.
      // The requirement is to include all fields displayed as columns.
      // We'll edit them in the 'extra' object directly or separate fields if they are standard.
      // Since the backend stores most of these in 'extra', we will edit them in 'extra'.
      extra: { ...ex },
    });
    setModalError('');
    setModal({ open: true, mode: 'edit', entry });
    scrollToEntryForm();
  }

  function closeModal() {
    setModal({ open: false, mode: null, entry: null });
    setForm(getEmptyForm(manifests[0]?._id || ''));
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
    if (!canManageEntries) return;
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
        setForm(getEmptyForm(form.manifestId || manifests[0]?._id || ''));
      } else {
        await api.patch(`/api/manifests/entries/${modal.entry._id}`, form);
        setForm(getEmptyForm(manifests[0]?._id || ''));
        setModal({ open: true, mode: 'create', entry: null });
      }
      fetchEntries();
      setModalLoading(false);
    } catch (err) {
      setModalError(err?.message || 'An error occurred. Please try again.');
      setModalLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!canManageEntries || !deleteConfirmId) return;
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

  async function handleBulkDeleteConfirm() {
    if (!canManageEntries) return;
    const idsToDelete = Array.from(selectedIds);
    if (!idsToDelete.length) return;
    setModalLoading(true);
    setModalError('');
    try {
      await api.post('/api/manifests/entries/bulk-delete', { ids: idsToDelete });
      setBulkDeleteConfirmOpen(false);
      setSelectedIds(new Set());
      fetchEntries();
    } catch (err) {
      const message = err?.message || '';
      // Backward-compatible fallback for servers that do not expose bulk-delete yet.
      if (message.toLowerCase().includes('not found')) {
        try {
          await Promise.all(idsToDelete.map((id) => api.delete(`/api/manifests/entries/${id}`)));
          setBulkDeleteConfirmOpen(false);
          setSelectedIds(new Set());
          fetchEntries();
          return;
        } catch (fallbackErr) {
          setModalError(fallbackErr?.message || 'Failed to delete selected entries. Please try again.');
          return;
        }
      }
      setModalError(message || 'Failed to delete selected entries. Please try again.');
    } finally {
      setModalLoading(false);
    }
  }

  function handleDownload() {
    const params = new URLSearchParams({
      search: searchTerm,
      sortBy: 'pickupDate',
      order: 'asc'
    });
    window.location.href = `/api-backend/manifests/entries/export?${params.toString()}`;
  }

  function hideMissingTooltip() {
    setMissingTooltip(prev => (prev.open ? { ...prev, open: false } : prev));
  }

  function showMissingTooltip(e, fields) {
    const rowRect = e.currentTarget.getBoundingClientRect();
    const tableRect = tableWrapRef.current?.getBoundingClientRect();
    const actionCellRect = e.currentTarget.querySelector('td')?.getBoundingClientRect();
    const tooltipWidth = 260;
    const anchorLeft = actionCellRect?.left ?? tableRect?.left ?? rowRect.left;
    let left = (anchorLeft - tooltipWidth) - 12;
    if (left < 8) left = 8;

    setMissingTooltip({
      open: true,
      fields,
      top: rowRect.top + (rowRect.height / 2),
      left,
    });
  }

  // Column derivation — new order
  const PREFERRED_ORDER = [
    'PickupDateTime', 'ResNumber', 'CustomerCode', 'CustomerName',
    'PassengerCellPhoneNumber', 'PassengerEmailAddress', 'PassengerFirstName', 'PassengerLastName',
    'PickupAddress', 'PickupPricingZone', 'DropoffPricingZone', 'DropoffAddress',
    'DispatchDriverCode', 'DispatchDriverName', 'DispatchVehicleCode', 'DispatchDriverPhoneNumber',
    'DispatchVehicleTypeCode', 'OnLocationDateTime', 'PassengerOnBoardDateTime',
    'SegmentStatusCode', 'SegmentTotal',
    'ContactEmailAddress', 'ContactFirstName', 'ContactLastName', 'ContactPhoneNumber'
  ];

  const allExtraColumns = Array.from(new Set(entries.flatMap(e => Object.keys(e.extra || {})))).sort((a, b) => {
    const aIdx = PREFERRED_ORDER.indexOf(a);
    const bIdx = PREFERRED_ORDER.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
  const hasSegmentStatus = allExtraColumns.includes('SegmentStatusCode');
  const remainingExtras = allExtraColumns.filter(c => c !== 'SegmentStatusCode');
  // Checkbox(1) + Actions(1) + [SegmentStatusCode?] + Name(1) + remainingExtras + Source(1)
  const totalCols = 4 + allExtraColumns.length;
  const sortedEntries = [...entries].sort((a, b) => {
    const aName = (a?.name || a?.extra?.PassengerName || '').trim();
    const bName = (b?.name || b?.extra?.PassengerName || '').trim();
    if (!aName && !bName) return 0;
    if (!aName) return 1;
    if (!bName) return -1;
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  });
  const visibleEntryIds = sortedEntries.map((entry) => entry._id).filter(Boolean);
  const selectedVisibleCount = visibleEntryIds.filter((id) => selectedIds.has(id)).length;
  const isAllVisibleSelected = visibleEntryIds.length > 0 && selectedVisibleCount === visibleEntryIds.length;
  const isSomeVisibleSelected = selectedVisibleCount > 0 && !isAllVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeVisibleSelected;
    }
  }, [isSomeVisibleSelected]);

  function toggleSelectAllVisible() {
    if (!canManageEntries) return;
    const next = new Set(selectedIds);
    if (isAllVisibleSelected) {
      visibleEntryIds.forEach((id) => next.delete(id));
    } else {
      visibleEntryIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  }

  function toggleSelectRow(id) {
    if (!canManageEntries) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: 'var(--page-padding)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Trips</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDownload}
            className="btn btn--secondary"
          >
            Download Excel
          </button>
          {canManageEntries && (
            <button
              onClick={openCreateModal}
              className="btn btn--primary"
            >
              Add Trip Entry
            </button>
          )}
        </div>
      </div>

      {canUpload && <ManifestUpload onUploadSuccess={handleUploadSuccess} />}

      {canManageEntries && modal.open && (
        <div
          ref={entryFormRef}
          className="card manifest-entry-inline-card"
          style={{ marginBottom: '24px' }}
        >
          <div className="card__header manifest-entry-inline-card__header">
            {modal.mode === 'create' ? 'Add New Trip Entry' : 'Edit Trip Entry'}
          </div>
          <form onSubmit={handleModalSubmit} className="card__body">
            <div style={FORM_FIELD_WRAP_STYLE}>
              <label style={LABEL_STYLE}>
                Select Manifest {modal.mode === 'create' && <span style={{ color: 'var(--danger)' }}>*</span>}
              </label>
              {modal.mode === 'create' ? (
                <select
                  value={form.manifestId || ''}
                  onChange={e => setField('manifestId', e.target.value)}
                  style={{ ...FIELD_STYLE }}
                  required
                >
                  <option value="">- Choose manifest -</option>
                  {manifests.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ ...FIELD_STYLE, background: 'var(--bg-section)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {modal.entry?.manifestId?.name || 'Unknown'}
                </div>
              )}
            </div>

            <div className="manifest-entry-grid">
              {/* ── Passenger ── */}
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Res Number"><input type="text" value={form.extra?.ResNumber || ''} onChange={e => setExtraField('ResNumber', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Customer Code"><input type="text" value={form.extra?.CustomerCode || ''} onChange={e => setExtraField('CustomerCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Customer Name"><input type="text" value={form.extra?.CustomerName || ''} onChange={e => setExtraField('CustomerName', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}>
                <FormField label="First Name">
                  <input
                    type="text"
                    value={form.extra?.PassengerFirstName || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        name: `${v} ${prev.extra?.PassengerLastName || ''}`.trim(),
                        extra: { ...prev.extra, PassengerFirstName: v },
                      }));
                    }}
                    style={FIELD_STYLE}
                    placeholder="e.g. John"
                  />
                </FormField>
              </div>
              <div style={FORM_FIELD_WRAP_STYLE}>
                <FormField label="Last Name">
                  <input
                    type="text"
                    value={form.extra?.PassengerLastName || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        name: `${prev.extra?.PassengerFirstName || ''} ${v}`.trim(),
                        extra: { ...prev.extra, PassengerLastName: v },
                      }));
                    }}
                    style={FIELD_STYLE}
                    placeholder="e.g. Doe"
                  />
                </FormField>
              </div>
              <div style={FORM_FIELD_WRAP_STYLE}>
                <FormField label="Cell Phone">
                  <input
                    type="text"
                    value={form.extra?.PassengerCellPhoneNumber || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setForm(prev => ({ ...prev, phone: v, extra: { ...prev.extra, PassengerCellPhoneNumber: v } }));
                    }}
                    style={FIELD_STYLE}
                    placeholder="+1..."
                  />
                </FormField>
              </div>
              <div style={FORM_FIELD_WRAP_STYLE}>
                <FormField label="Email Address">
                  <input
                    type="email"
                    value={form.extra?.PassengerEmailAddress || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setForm(prev => ({ ...prev, email: v, extra: { ...prev.extra, PassengerEmailAddress: v } }));
                    }}
                    style={FIELD_STYLE}
                    placeholder="email@example.com"
                  />
                </FormField>
              </div>

              {/* ── Trip Details ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-dim)', paddingTop: '20px', marginTop: '4px', marginBottom: '20px' }}>
                <div className="widget-subhead">Trip Details</div>
              </div>

              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Date"><input type="date" value={form.pickupDate || ''} onChange={e => setField('pickupDate', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Time"><input type="text" value={form.pickupTime || ''} onChange={e => setField('pickupTime', e.target.value)} style={FIELD_STYLE} placeholder="HH:MM AM/PM" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Address"><input type="text" value={form.pickupAddress || ''} onChange={e => setField('pickupAddress', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dropoff Address"><input type="text" value={form.dropoffAddress || ''} onChange={e => setField('dropoffAddress', e.target.value)} style={FIELD_STYLE} /></FormField></div>

              {/* ── Dispatch & Status ── */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-dim)', paddingTop: '20px', marginTop: '4px', marginBottom: '20px' }}>
                <div className="widget-subhead">Dispatch & Status</div>
              </div>

              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Driver Code"><input type="text" value={form.extra?.DispatchDriverCode || ''} onChange={e => setExtraField('DispatchDriverCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Driver Name"><input type="text" value={form.extra?.DispatchDriverName || ''} onChange={e => setExtraField('DispatchDriverName', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Vehicle Code"><input type="text" value={form.extra?.DispatchVehicleCode || ''} onChange={e => setExtraField('DispatchVehicleCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Driver Phone"><input type="text" value={form.extra?.DispatchDriverPhoneNumber || ''} onChange={e => setExtraField('DispatchDriverPhoneNumber', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Vehicle Type"><input type="text" value={form.extra?.DispatchVehicleTypeCode || ''} onChange={e => setExtraField('DispatchVehicleTypeCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}>
                <FormField label="Segment Status">
                  <select
                    value={form.extra?.SegmentStatusCode || ''}
                    onChange={e => setExtraField('SegmentStatusCode', e.target.value)}
                    style={{ ...FIELD_STYLE }}
                  >
                    <option value="">Select status</option>
                    {SEGMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {(() => {
                // Keys already rendered as hardcoded fields above
                const handledKeys = new Set([
                  'ResNumber', 'CustomerCode', 'CustomerName',
                  'PassengerFirstName', 'PassengerLastName', 'PassengerCellPhoneNumber', 'PassengerEmailAddress', 'PassengerName',
                  'DispatchDriverCode', 'DispatchDriverName', 'DispatchVehicleCode', 'DispatchDriverPhoneNumber', 'DispatchVehicleTypeCode',
                  'SegmentStatusCode',
                ]);
                // Keys handled by top-level form fields (pickupDate/Time, pickupAddress, dropoffAddress)
                // or internal schema fields — skip entirely from dynamic section
                const skipKeys = new Set([
                  'PickupDateTime', 'Pickup Date Time', 'Pickup Date/Time',
                  'PickupAddress', 'DropoffAddress',
                  'status', 'Status',
                ]);
                const dynamicCols = Array.from(new Set([
                  ...allExtraColumns,
                  ...Object.keys(form.extra || {}),
                ])).filter(k => !handledKeys.has(k) && !skipKeys.has(k));
                if (dynamicCols.length === 0) return null;
                return (
                  <>
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-dim)', paddingTop: '20px', marginTop: '4px', marginBottom: '20px' }}>
                      <div className="widget-subhead">Additional Details</div>
                    </div>
                    {dynamicCols.map(key => (
                      <div key={key} style={FORM_FIELD_WRAP_STYLE}>
                        <FormField label={key}>
                          <input
                            type="text"
                            value={form.extra?.[key] || ''}
                            onChange={e => setExtraField(key, e.target.value)}
                            style={FIELD_STYLE}
                          />
                        </FormField>
                      </div>
                    ))}
                  </>
                );
              })()}

              {modalError && (
                <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', padding: '12px', background: 'rgba(153, 27, 27, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                  {modalError}
                </div>
              )}
            </div>

            <div className="manifest-entry-inline-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-dim)', marginTop: '16px' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={modalLoading}
                className="btn btn--secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="btn btn--primary"
              >
                {modalLoading ? 'Saving...' : (modal.mode === 'edit' ? 'Update Entry' : 'Create Entry')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card__header" style={{ padding: '16px 24px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search trips (name, phone, email, res#)..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                paddingLeft: '36px',
                width: '100%',
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', opacity: 0.8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {canManageEntries && selectedIds.size > 0 && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(201, 162, 74, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600 }}>
              {selectedIds.size} entries selected
            </span>
            <button
              onClick={() => { setBulkDeleteConfirmOpen(true); setModalError(''); }}
              className="btn btn--danger btn--sm"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Table */}
        <div className="table-wrap" ref={tableWrapRef}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '56px', textAlign: 'center' }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={!canManageEntries}
                    style={{ cursor: canManageEntries ? 'pointer' : 'not-allowed', width: '18px', height: '18px' }}
                  />
                </th>
                <th>Actions</th>
                {hasSegmentStatus && (
                  <th>Status</th>
                )}
                <th>Passenger</th>
                {remainingExtras.map(col => (
                  <th key={col}>{col === 'PickupDateTime' ? 'Pickup' : col}</th>
                ))}
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalCols} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="page-loader" style={{ position: 'static', background: 'none' }}>Loading trips...</div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No trip entries found matching your search.
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry, index) => {
                  const entryKey = getEntryPrimaryKey(entry);
                  const reactKey = getEntryReactKey(entry, index);
                  const status = rowStatus[entryKey] || {};
                  const isSending = !!status.sending;
                  const isDeleting = deleteConfirmId === entry._id && modalLoading;
                  const isSelected = selectedIds.has(entry._id);
                  const missingRequiredFields = getMissingRequiredFields(entry);
                  const hasMissingRequiredFields = missingRequiredFields.length > 0;
                  const noEmailOnFile = !entry.extra?.PassengerEmailAddress && !entry.extra?.['Passenger Email Address'];
                  const noPhoneOnFile = !entry.phone && !entry.extra?.PassengerCellPhoneNumber && !entry.extra?.PassngerCellPhoneNumber;
                  const emailAlreadySent = status.sent === 'email';
                  const disableEmail = !canManageEntries || isSending || hasMissingRequiredFields || noEmailOnFile || emailAlreadySent;
                  const disableSms = !canManageEntries || isSending || hasMissingRequiredFields || noPhoneOnFile;
                  const missingFieldsTitle = hasMissingRequiredFields
                    ? `Missing: ${missingRequiredFields.join(', ')}`
                    : null;

                  return (
                    <tr
                      key={reactKey}
                      className={`${hasMissingRequiredFields ? 'row-invalid' : ''} ${isSelected ? 'row-selected' : ''}`}
                      onMouseEnter={hasMissingRequiredFields ? (e) => showMissingTooltip(e, missingRequiredFields) : undefined}
                      onMouseLeave={hasMissingRequiredFields ? hideMissingTooltip : undefined}
                      style={{ background: isSelected ? 'rgba(201, 162, 74, 0.05)' : undefined }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(entry._id)}
                          disabled={!canManageEntries}
                          style={{ cursor: canManageEntries ? 'pointer' : 'not-allowed', width: '18px', height: '18px' }}
                        />
                      </td>
                      <td className="actions-cell">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', minWidth: '150px' }}>
                          {entry.isRestricted ? (
                            <div
                              title="Excluded – Restriction List"
                              style={{ gridColumn: '1 / -1', fontSize: '11px', color: 'var(--danger)', opacity: 0.7, textAlign: 'center', padding: '4px 0' }}
                            >
                              Restricted
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSendReview(entry, 'email')}
                                disabled={disableEmail}
                                title={missingFieldsTitle || (noEmailOnFile ? 'No email' : 'Send Email')}
                                className={`btn btn--sm ${status.sent === 'email' ? 'btn--secondary' : 'btn--primary'}`}
                                style={{ width: '100%' }}
                              >
                                {status.sending === 'email' ? '...' : (status.sent === 'email' ? 'Sent' : 'Email')}
                              </button>
                              <button
                                onClick={() => handleSendReview(entry, 'sms')}
                                disabled={disableSms}
                                title={missingFieldsTitle || (noPhoneOnFile ? 'No phone' : 'Send SMS')}
                                className={`btn btn--sm ${status.sent === 'sms' ? 'btn--secondary' : 'btn--primary'}`}
                                style={{ width: '100%' }}
                              >
                                {status.sending === 'sms' ? '...' : (status.sent === 'sms' ? 'Sent' : 'SMS')}
                              </button>
                            </>
                          )}
                          {canManageEntries && (
                            <>
                              <button
                                onClick={() => openEditModal(entry)}
                                disabled={isSending}
                                className="btn btn--secondary btn--sm"
                                title="Edit"
                                style={{ width: '100%' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => { setDeleteConfirmId(entry._id); setModalError(''); }}
                                disabled={isSending || isDeleting}
                                className="btn btn--secondary btn--sm"
                                title="Delete"
                                style={{ width: '100%', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'var(--danger)' }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                        {status.error && <div className="text-danger text-xs mt-1">{status.error}</div>}
                      </td>
                      {hasSegmentStatus && (
                        <td>
                          <span className={`badge ${entry.extra?.SegmentStatusCode === 'COMP' ? 'badge--green' : 'badge--gold'}`}>
                            {entry.extra?.SegmentStatusCode || '-'}
                          </span>
                        </td>
                      )}
                      <td>
                        <div className="font-medium">{entry.name || 'Unknown'}</div>
                        <div className="text-xs text-muted">{entry.extra?.PassengerEmailAddress || entry.email || '-'}</div>
                      </td>
                      {remainingExtras.map(col => {
                        const isPickupDateTime = col === 'PickupDateTime' || col === 'Pickup Date Time';
                        const rawValue = entry.extra?.[col];
                        const value = isPickupDateTime
                          ? (formatPickupDateTimeFromParts(entry.pickupDate, entry.pickupTime) || formatPickupDateTime(rawValue))
                          : (rawValue || '-');

                        return (
                          <td key={col} className={isPickupDateTime ? 'font-medium text-accent' : ''}>{value}</td>
                        );
                      })}
                      <td className="text-xs text-muted">
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
          <div className="card__footer" style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <button
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn--secondary btn--sm"
            >
              Previous
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isCurrent ? 'var(--accent)' : 'var(--border-dim)',
                        background: isCurrent ? 'var(--accent)' : 'transparent',
                        color: isCurrent ? '#000' : 'var(--text-main)',
                        fontWeight: 700,
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
                  return <span key={pageNum} style={{ padding: '0 2px', color: 'var(--text-muted)' }}>...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn--secondary btn--sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {missingTooltip.open && (
        <div
          className="tooltip-float"
          style={{ top: `${missingTooltip.top}px`, left: `${missingTooltip.left}px` }}
          role="tooltip"
        >
          <div className="tooltip-title">Missing Fields</div>
          <ul className="tooltip-list">
            {missingTooltip.fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Modals handled via state - showing standardized versions */}
      {(deleteConfirmId || bulkDeleteConfirmOpen) && (
        <div style={OVERLAY_STYLE} onClick={() => { if (!modalLoading) { setDeleteConfirmId(null); setBulkDeleteConfirmOpen(false); } }}>
          <div style={{ ...MODAL_STYLE, maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '32px' }}>⚠️</div>
            <h2 className="widget-header" style={{ border: 'none', justifyContent: 'center' }}>
              {deleteConfirmId ? 'Delete Entry' : 'Delete Selected'}
            </h2>
            <p className="text-secondary mb-8">
              {deleteConfirmId
                ? 'Are you sure? This action cannot be undone and will remove associated review records.'
                : `Are you sure you want to delete ${selectedIds.size} selected entries?`
              }
            </p>
            {modalError && <div className="text-danger mb-4 text-sm">{modalError}</div>}
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setDeleteConfirmId(null); setBulkDeleteConfirmOpen(false); }} disabled={modalLoading} className="btn btn--secondary">Cancel</button>
              <button onClick={deleteConfirmId ? handleDeleteConfirm : handleBulkDeleteConfirm} disabled={modalLoading} className="btn btn--danger">
                {modalLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal.open && (
        <div style={OVERLAY_STYLE} onClick={() => setAlertModal({ open: false, message: '' })}>
          <div style={{ ...MODAL_STYLE, maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '32px' }}>ⓘ</div>
            <h2 className="widget-header" style={{ border: 'none', justifyContent: 'center' }}>Notice</h2>
            <p className="text-secondary mb-8">{alertModal.message}</p>
            <button onClick={() => setAlertModal({ open: false, message: '' })} className="btn btn--primary w-full">Got it</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .manifest-entry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .row-invalid {
          border-left: 2px solid var(--danger);
        }
        .tooltip-float {
          position: fixed;
          background: #1e1e1e;
          border: 1px solid var(--danger);
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          z-index: 10000;
          pointer-events: none;
          transform: translateY(-50%);
        }
        .tooltip-title {
          font-weight: 700;
          color: var(--danger);
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .tooltip-list {
          list-style: none;
          margin: 0;
          padding: 0;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .tooltip-list li::before {
          content: '• ';
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}




