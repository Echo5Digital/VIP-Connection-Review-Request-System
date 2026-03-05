'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ManifestUpload } from '@/app/admin/manifest/ManifestUpload';
import { formatPickupDateTime, formatPickupDateTimeFromParts } from '@/lib/pickupDateTime';

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
  border: '1px solid #cfe1d4', padding: '0 10px', fontSize: '14px',
  boxSizing: 'border-box',
};
const LABEL_STYLE = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' };
const FORM_FIELD_WRAP_STYLE = { marginBottom: '14px' };

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
  const valueByField = {
    ResNumber: extra.ResNumber || entry?.resNumber,
    PickupDateTime: extra.PickupDateTime || ((entry?.pickupDate || entry?.pickupTime) ? `${entry?.pickupDate || ''}${entry?.pickupTime || ''}` : ''),
    PassengerName: entry?.name || extra.PassengerName,
    PassengerCellPhoneNumber: extra.PassengerCellPhoneNumber || extra.PassngerCellPhoneNumber || entry?.phone,
    PassengerEmailAddress: extra.PassengerEmailAddress || extra['Passenger Email Address'],
    PassengerFirstName: extra.PassengerFirstName,
    PassengerLastName: extra.PassengerLastName,
    DispatchDriverCode: extra.DispatchDriverCode,
    DispatchDriverName: extra.DispatchDriverName,
    DispatchVehicleCode: extra.DispatchVehicleCode,
    DispatchDriverPhoneNumber: extra.DispatchDriverPhoneNumber,
    DispatchVehicleTypeCode: extra.DispatchVehicleTypeCode,
  };

  return REQUIRED_REVIEW_FIELDS.filter((field) => !hasValue(valueByField[field]));
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
  const [isActiveClient, setIsActiveClient] = useState(false);
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
      setIsActiveClient(false);
      return;
    }
    api.get('/api/auth/me')
      .then((data) => setIsActiveClient(data?.user?.active === true))
      .catch(() => setIsActiveClient(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!(isAdmin || isActiveClient)) return;
    api.get('/api/manifests')
      .then(data => setManifests(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, [isAdmin, isActiveClient]);

  const canManageEntries = isAdmin || isActiveClient;
  const canUpload = isAdmin || isActiveClient;

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
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Trips</h1>
      </div>

      {canUpload && <ManifestUpload onUploadSuccess={handleUploadSuccess} />}

      {canManageEntries && modal.open && (
        <div
          ref={entryFormRef}
          className="card manifest-entry-inline-card"
          style={{ background: '#e3f2e8', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', border: '1px solid #bddbc7' }}
        >
          <div className="card__header manifest-entry-inline-card__header" style={{ padding: '16px 24px', borderBottom: '1px solid #bddbc7', background: '#d7ebdf', fontWeight: '600' }}>
            {modal.mode === 'create' ? 'Add Entry' : 'Edit Entry'}
          </div>
          <form onSubmit={handleModalSubmit} className="manifest-entry-inline-card__body" style={{ padding: '16px 24px 20px' }}>
            <div style={FORM_FIELD_WRAP_STYLE}>
              <label style={LABEL_STYLE}>
                Manifest {modal.mode === 'create' && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              {modal.mode === 'create' ? (
                <select
                  value={form.manifestId || ''}
                  onChange={e => setField('manifestId', e.target.value)}
                  style={{ ...FIELD_STYLE }}
                  required
                >
                  <option value="">- Select manifest -</option>
                  {manifests.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ ...FIELD_STYLE, background: '#f4f8f4', color: '#577162', display: 'flex', alignItems: 'center' }}>
                  {modal.entry?.manifestId?.name || 'Unknown'}
                </div>
              )}
            </div>

            <div className="manifest-entry-grid">
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Passenger First Name"><input type="text" value={form.extra?.PassengerFirstName || ''} onChange={e => setExtraField('PassengerFirstName', e.target.value)} style={FIELD_STYLE} placeholder="First Name" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Passenger Last Name"><input type="text" value={form.extra?.PassengerLastName || ''} onChange={e => setExtraField('PassengerLastName', e.target.value)} style={FIELD_STYLE} placeholder="Last Name" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Passenger Phone (Cell)"><input type="text" value={form.extra?.PassengerCellPhoneNumber || ''} onChange={e => setExtraField('PassengerCellPhoneNumber', e.target.value)} style={FIELD_STYLE} placeholder="Cell Phone" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Passenger Email"><input type="email" value={form.extra?.PassengerEmailAddress || ''} onChange={e => setExtraField('PassengerEmailAddress', e.target.value)} style={FIELD_STYLE} placeholder="Email Address" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Passenger Name (Full)"><input type="text" value={form.name || ''} onChange={e => setField('name', e.target.value)} style={FIELD_STYLE} placeholder="Full name" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Mapped Phone"><input type="text" value={form.phone || ''} onChange={e => setField('phone', e.target.value)} style={FIELD_STYLE} placeholder="+1 555 000 0000" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Mapped Email"><input type="email" value={form.email || ''} onChange={e => setField('email', e.target.value)} style={FIELD_STYLE} placeholder="email@example.com" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Status"><input type="text" value={form.status || ''} onChange={e => setField('status', e.target.value)} style={FIELD_STYLE} placeholder="Pending" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Date"><input type="date" value={form.pickupDate || ''} onChange={e => setField('pickupDate', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Time"><input type="text" value={form.pickupTime || ''} onChange={e => setField('pickupTime', e.target.value)} style={FIELD_STYLE} placeholder="e.g. 08:30 AM" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Address"><input type="text" value={form.pickupAddress || ''} onChange={e => setField('pickupAddress', e.target.value)} style={FIELD_STYLE} placeholder="Pickup Address" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dropoff Address"><input type="text" value={form.dropoffAddress || ''} onChange={e => setField('dropoffAddress', e.target.value)} style={FIELD_STYLE} placeholder="Dropoff Address" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Pickup Pricing Zone"><input type="text" value={form.extra?.PickupPricingZone || ''} onChange={e => setExtraField('PickupPricingZone', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dropoff Pricing Zone"><input type="text" value={form.extra?.DropoffPricingZone || ''} onChange={e => setExtraField('DropoffPricingZone', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Res Number"><input type="text" value={form.extra?.ResNumber || ''} onChange={e => setExtraField('ResNumber', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Customer Code"><input type="text" value={form.extra?.CustomerCode || ''} onChange={e => setExtraField('CustomerCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Customer Name"><input type="text" value={form.extra?.CustomerName || ''} onChange={e => setExtraField('CustomerName', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="On Location Date/Time"><input type="text" value={form.extra?.OnLocationDateTime || ''} onChange={e => setExtraField('OnLocationDateTime', e.target.value)} style={FIELD_STYLE} placeholder="YYYY-MM-DD HH:mm:ss" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Passenger On Board Date/Time"><input type="text" value={form.extra?.PassengerOnBoardDateTime || ''} onChange={e => setExtraField('PassengerOnBoardDateTime', e.target.value)} style={FIELD_STYLE} placeholder="YYYY-MM-DD HH:mm:ss" /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}>
                <FormField label="Segment Status Code">
                  <select
                    value={form.extra?.SegmentStatusCode || ''}
                    onChange={e => setExtraField('SegmentStatusCode', e.target.value)}
                    style={{ ...FIELD_STYLE }}
                  >
                    <option value="">Select status</option>
                    {SEGMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    {form.extra?.SegmentStatusCode && !SEGMENT_STATUS_OPTIONS.includes(form.extra.SegmentStatusCode) && (
                      <option value={form.extra.SegmentStatusCode}>{form.extra.SegmentStatusCode}</option>
                    )}
                  </select>
                </FormField>
              </div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Segment Total"><input type="text" value={form.extra?.SegmentTotal || ''} onChange={e => setExtraField('SegmentTotal', e.target.value)} style={FIELD_STYLE} /></FormField></div>

              <div style={{ gridColumn: '1 / -1', fontSize: '13px', fontWeight: '600', color: '#111827', margin: '4px 0 8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                Dispatch Info
              </div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dispatch Driver Code"><input type="text" value={form.extra?.DispatchDriverCode || ''} onChange={e => setExtraField('DispatchDriverCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dispatch Driver Name"><input type="text" value={form.extra?.DispatchDriverName || ''} onChange={e => setExtraField('DispatchDriverName', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dispatch Vehicle Code"><input type="text" value={form.extra?.DispatchVehicleCode || ''} onChange={e => setExtraField('DispatchVehicleCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dispatch Driver Phone"><input type="text" value={form.extra?.DispatchDriverPhoneNumber || ''} onChange={e => setExtraField('DispatchDriverPhoneNumber', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Dispatch Vehicle Type Code"><input type="text" value={form.extra?.DispatchVehicleTypeCode || ''} onChange={e => setExtraField('DispatchVehicleTypeCode', e.target.value)} style={FIELD_STYLE} /></FormField></div>

              <div style={{ gridColumn: '1 / -1', fontSize: '13px', fontWeight: '600', color: '#111827', margin: '4px 0 8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                Contact Info
              </div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Contact First Name"><input type="text" value={form.extra?.ContactFirstName || ''} onChange={e => setExtraField('ContactFirstName', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Contact Last Name"><input type="text" value={form.extra?.ContactLastName || ''} onChange={e => setExtraField('ContactLastName', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Contact Email"><input type="email" value={form.extra?.ContactEmailAddress || ''} onChange={e => setExtraField('ContactEmailAddress', e.target.value)} style={FIELD_STYLE} /></FormField></div>
              <div style={FORM_FIELD_WRAP_STYLE}><FormField label="Contact Phone"><input type="text" value={form.extra?.ContactPhoneNumber || ''} onChange={e => setExtraField('ContactPhoneNumber', e.target.value)} style={FIELD_STYLE} /></FormField></div>

              {modal.mode === 'edit' && Object.keys(form.extra || {}).length > 0 && (
                <div style={{ ...FORM_FIELD_WRAP_STYLE, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
                    Additional Fields
                  </div>
                  <div className="manifest-entry-grid manifest-entry-grid--nested">
                    {Object.keys(form.extra).map(key => (
                      <div key={key} style={FORM_FIELD_WRAP_STYLE}>
                        <FormField label={key}>
                          <input
                            type="text"
                            value={form.extra[key] || ''}
                            onChange={e => setExtraField(key, e.target.value)}
                            style={FIELD_STYLE}
                          />
                        </FormField>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modalError && (
                <div style={{ gridColumn: '1 / -1', color: '#dc2626', fontSize: '13px', marginBottom: '16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  {modalError}
                </div>
              )}
            </div>

            <div className="manifest-entry-inline-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={modalLoading}
                style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #cfe1d4', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#1d7149', color: '#fff', cursor: modalLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', opacity: modalLoading ? 0.7 : 1 }}
              >
                {modalLoading ? 'Saving...' : (modal.mode === 'edit' ? 'Apply Changes' : 'Add Entry')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="card__header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2ece3', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>All Manifest Entries</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '7px 16px', fontSize: '13px', fontWeight: '500',
                borderRadius: '6px', border: '1px solid #cfe1d4',
                background: '#fff', color: '#374151', cursor: 'pointer',
              }}
            >
              Download Excel
            </button>
            {canManageEntries && (
              <button
                onClick={openCreateModal}
                style={{
                  padding: '7px 16px', fontSize: '13px', fontWeight: '500',
                  borderRadius: '6px', border: 'none',
                  background: '#1d7149', color: '#fff', cursor: 'pointer',
                }}
              >
                + Add Entry
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2ece3', background: '#f8fafc' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '560px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, phone, email, res#, code, etc..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ paddingLeft: '36px', height: '40px', borderRadius: '6px', border: '1px solid #cfe1d4', width: '100%' }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#577162' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {canManageEntries && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2ece3', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: '#486050', fontSize: '14px', fontWeight: 500 }}>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select entries to delete'}
            </span>
            {selectedIds.size > 0 && (
              <button
                onClick={() => { setBulkDeleteConfirmOpen(true); setModalError(''); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  minWidth: '170px'
                }}
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }} ref={tableWrapRef}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#f4f8f4', color: '#486050', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px', fontWeight: '600', borderBottom: '1px solid #e2ece3', width: '56px', textAlign: 'center' }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={!canManageEntries}
                    aria-label="Select all visible rows"
                    style={{ width: '16px', height: '16px', cursor: canManageEntries ? 'pointer' : 'not-allowed', accentColor: '#1d7149' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2ece3', minWidth: '220px' }}>Actions</th>
                {hasSegmentStatus && (
                  <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2ece3' }}>SegmentStatusCode</th>
                )}
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2ece3', minWidth: '150px' }}>Passenger Name</th>
                {remainingExtras.map(col => (
                  <th key={col} style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2ece3' }}>{col}</th>
                ))}
                <th style={{ padding: '12px 16px', fontWeight: '600', borderBottom: '1px solid #e2ece3', minWidth: '150px' }}>Source (Manifest)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={totalCols} style={{ padding: '32px', textAlign: 'center', color: '#577162' }}>Loading entries...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} style={{ padding: '32px', textAlign: 'center', color: '#577162' }}>
                    No entries found. Adjust filters and try again.
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
                    ? `Missing required fields: ${missingRequiredFields.join(', ')}`
                    : null;
                  const roleTitle = !canManageEntries ? 'Only admin or active clients can perform this action' : null;
                  return (
                    <tr
                      key={reactKey}
                      className={hasMissingRequiredFields ? 'review-request-row-invalid' : undefined}
                      onMouseEnter={hasMissingRequiredFields ? (e) => showMissingTooltip(e, missingRequiredFields) : undefined}
                      onMouseLeave={hasMissingRequiredFields ? hideMissingTooltip : undefined}
                      onFocus={hasMissingRequiredFields ? (e) => showMissingTooltip(e, missingRequiredFields) : undefined}
                      onBlur={hasMissingRequiredFields ? hideMissingTooltip : undefined}
                      style={{
                        borderBottom: '1px solid #e2ece3',
                        background: isSelected ? '#f3fbf5' : undefined,
                      }}
                    >
                      {/* Actions column — first */}
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(entry._id)}
                          disabled={!canManageEntries}
                          aria-label={`Select ${entry.name || 'entry'}`}
                          style={{ width: '16px', height: '16px', cursor: canManageEntries ? 'pointer' : 'not-allowed', accentColor: '#1d7149' }}
                        />
                      </td>
                      <td className="admin-review-actions-cell">
                        {status.error && (
                          <div className="admin-review-actions-error">
                            {status.error}
                          </div>
                        )}
                        {status.info && (
                          <div style={{ marginBottom: '6px', color: '#166534', fontSize: '12px' }}>
                            {status.info}
                          </div>
                        )}
                        <div className="admin-review-actions-grid">
                          {/* Email */}
                          <button
                            onClick={() => handleSendReview(entry, 'email')}
                            disabled={disableEmail}
                            title={roleTitle || missingFieldsTitle || (noEmailOnFile ? 'No email on file' : 'Send review request via email')}
                            className={`admin-review-action-btn admin-review-action-btn--primary${status.sent === 'email' ? ' admin-review-action-btn--sent' : ''}`}
                          >
                            {status.sending === 'email' ? (
                              <span className="admin-review-action-spinner" />
                            ) : null}
                            {status.sent === 'email' ? 'Sent' : 'Email'}
                          </button>
                          {/* SMS */}
                          <button
                            onClick={() => handleSendReview(entry, 'sms')}
                            disabled={disableSms}
                            title={roleTitle || missingFieldsTitle || (noPhoneOnFile ? 'No phone on file' : 'Send review request via SMS')}
                            className={`admin-review-action-btn admin-review-action-btn--primary${status.sent === 'sms' ? ' admin-review-action-btn--sent' : ''}`}
                          >
                            {status.sending === 'sms' ? (
                              <span className="admin-review-action-spinner" />
                            ) : null}
                            {status.sent === 'sms' ? 'Sent' : 'SMS'}
                          </button>
                          {canManageEntries && (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(entry)}
                                disabled={isSending}
                                title="Edit entry"
                                className="admin-review-action-btn"
                              >
                                Edit
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => { setDeleteConfirmId(entry._id); setModalError(''); }}
                                disabled={isSending || isDeleting}
                                title="Delete entry"
                                className="admin-review-action-btn admin-review-action-btn--danger"
                              >
                                Delete
                              </button>
                            </>
                          )}
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
                      {remainingExtras.map(col => {
                        const isPickupDateTime = col === 'PickupDateTime' || col === 'Pickup Date Time';
                        const rawValue = entry.extra?.[col];
                        const value = isPickupDateTime
                          ? (formatPickupDateTimeFromParts(entry.pickupDate, entry.pickupTime) || formatPickupDateTime(rawValue))
                          : (rawValue || '');

                        return (
                          <td key={col} style={{ padding: '12px 16px' }}>{value}</td>
                        );
                      })}
                      {/* Source (Manifest) — last */}
                      <td style={{ padding: '12px 16px', color: '#577162', fontSize: '13px' }}>
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
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2ece3' }}>
            <button
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cfe1d4', background: currentPage === 1 ? '#f4f8f4' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#2f493b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >Previous</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#486050' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cfe1d4', background: currentPage === totalPages ? '#f4f8f4' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#2f493b', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >Next</button>
          </div>
        )}
      </div>

      {missingTooltip.open && (
        <div
          className="review-request-missing-tooltip-float"
          style={{ top: `${missingTooltip.top}px`, left: `${missingTooltip.left}px` }}
          role="tooltip"
        >
          <div className="review-request-missing-tooltip__title">Missing required fields</div>
          <ul className="review-request-missing-tooltip__list">
            {missingTooltip.fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete confirmation modal */}
      {canManageEntries && deleteConfirmId && (
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
                style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cfe1d4', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '14px' }}
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

      {canManageEntries && bulkDeleteConfirmOpen && (
        <div style={OVERLAY_STYLE} onClick={() => { if (!modalLoading) setBulkDeleteConfirmOpen(false); }}>
          <div style={{ ...MODAL_STYLE, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Delete Selected Entries</h2>
            <p style={{ margin: '0 0 20px', color: '#4b5563', fontSize: '14px' }}>
              Are you sure you want to delete {selectedIds.size} selected entries?
            </p>
            {modalError && (
              <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                {modalError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBulkDeleteConfirmOpen(false)}
                disabled={modalLoading}
                style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cfe1d4', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={modalLoading || selectedIds.size === 0}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: modalLoading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: modalLoading ? 0.7 : 1 }}
              >
                {modalLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.open && (
        <div style={OVERLAY_STYLE} onClick={() => setAlertModal({ open: false, message: '' })}>
          <div style={{ ...MODAL_STYLE, maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '16px', color: '#f59e0b', display: 'flex', justifyContent: 'center' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Notice</h2>
            <p style={{ margin: '0 0 24px', color: '#4b5563', fontSize: '15px' }}>
              {alertModal.message}
            </p>
            <button
              onClick={() => setAlertModal({ open: false, message: '' })}
              style={{
                padding: '10px 24px', borderRadius: '6px', border: 'none',
                background: '#1d7149', color: '#fff', cursor: 'pointer',
                fontSize: '14px', fontWeight: '500'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .manifest-entry-inline-card {
          background: #e3f2e8 !important;
          border-color: #bddbc7 !important;
        }
        .manifest-entry-inline-card__header {
          background: #d7ebdf !important;
          border-bottom-color: #bddbc7 !important;
        }
        .manifest-entry-inline-card__body {
          background: #e3f2e8 !important;
        }
        .manifest-entry-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          column-gap: 16px;
          align-items: start;
        }
        .manifest-entry-grid--nested {
          margin-top: 8px;
        }
        @media (max-width: 1280px) {
          .manifest-entry-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 1024px) {
          .manifest-entry-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 768px) {
          .manifest-entry-grid {
            grid-template-columns: 1fr;
          }
          .manifest-entry-inline-actions {
            flex-direction: column;
          }
          .manifest-entry-inline-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}




