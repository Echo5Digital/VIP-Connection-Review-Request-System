'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function RestrictionsPage() {
    const [restrictions, setRestrictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Blocked entries log
    const [blockedEntries, setBlockedEntries] = useState([]);
    const [blockedTotal, setBlockedTotal] = useState(0);
    const [blockedLoading, setBlockedLoading] = useState(true);

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [formData, setFormData] = useState({
        customerCode: '',
        passengerName: '',
        email: '',
        phone: '',
        reason: '',
    });

    // Backfill state
    const [backfillLoading, setBackfillLoading] = useState(false);
    const [backfillResult, setBackfillResult] = useState(null);

    useEffect(() => {
        fetchRestrictions();
        fetchBlockedEntries();
    }, []);

    async function fetchRestrictions() {
        try {
            setLoading(true);
            const data = await api.get('/api/restrictions');
            setRestrictions(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchBlockedEntries() {
        try {
            setBlockedLoading(true);
            const data = await api.get('/api/restrictions/blocked?limit=100');
            setBlockedEntries(data?.entries || []);
            setBlockedTotal(data?.total || 0);
        } catch {
            // non-critical, ignore
        } finally {
            setBlockedLoading(false);
        }
    }

    function openAddModal() {
        setEditingEntry(null);
        setFormData({
            customerCode: '',
            passengerName: '',
            email: '',
            phone: '',
            reason: '',
        });
        setIsModalOpen(true);
    }

    function openEditModal(item) {
        setEditingEntry(item);
        setFormData({
            customerCode: item.customerCode || '',
            passengerName: item.passengerName || '',
            email: item.email || '',
            phone: item.phone || '',
            reason: item.reason || '',
        });
        setIsModalOpen(true);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingEntry) {
                await api.put(`/api/restrictions/${editingEntry._id}`, formData);
                setSuccess('Entry updated');
            } else {
                await api.post('/api/restrictions', formData);
                setSuccess('Entry added to list');
            }
            setIsModalOpen(false);
            fetchRestrictions();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleBackfill() {
        if (!confirm('Scan all existing trips for restriction matches and flag them? This may take a moment.')) return;
        setBackfillLoading(true);
        setBackfillResult(null);
        setError('');
        try {
            const result = await api.post('/api/restrictions/backfill', {});
            setBackfillResult(result);
            fetchRestrictions();
            fetchBlockedEntries();
        } catch (err) {
            setError(err.message);
        } finally {
            setBackfillLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to remove this restriction?')) return;
        try {
            await api.delete(`/api/restrictions/${id}`);
            fetchRestrictions();
            setSuccess('Restriction removed');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>Restriction List</h1>
                    <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
                        Customers or passengers in this list will not receive review requests.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        onClick={handleBackfill}
                        disabled={backfillLoading}
                        className="btn btn--outline btn--sm"
                        title="Scan existing trips and flag any that match restriction rules"
                    >
                        {backfillLoading ? 'Scanning...' : 'Backfill Existing Trips'}
                    </button>
                    <button onClick={openAddModal} className="btn btn--primary btn--sm">
                        Add Restriction
                    </button>
                </div>
            </div>

            {error && <div className="form-error mb-4">{error}</div>}
            {success && <div className="form-success mb-4">{success}</div>}
            {backfillResult && (
                <div className="form-success mb-4">
                    Backfill complete — {backfillResult.updated} trip{backfillResult.updated !== 1 ? 's' : ''} flagged
                    {backfillResult.restrictionsCreated > 0 && `, ${backfillResult.restrictionsCreated} new restriction record${backfillResult.restrictionsCreated !== 1 ? 's' : ''} created`}.
                </div>
            )}

            <div className="card">
                <div className="card__header">Restricted Profiles</div>

                {loading ? (
                    <p className="card__empty">Loading list...</p>
                ) : restrictions.length === 0 ? (
                    <p className="card__empty">The restriction list is empty.</p>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Customer Code</th>
                                    <th>Passenger Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Reason</th>
                                    <th>Source</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restrictions.map((item) => (
                                    <tr key={item._id}>
                                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent)', fontSize: '13px' }}>{item.customerCode || '—'}</td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.passengerName || '—'}</td>
                                        <td>{item.email || '—'}</td>
                                        <td>{item.phone || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.reason || '—'}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                                                background: item.source === 'Manifest Auto-Detection' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
                                                color: item.source === 'Manifest Auto-Detection' ? 'var(--blue-400, #60a5fa)' : 'var(--text-muted)',
                                            }}>
                                                {item.source === 'Manifest Auto-Detection' ? 'Auto-Detected' : 'Manual'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => openEditModal(item)} className="btn btn--secondary btn--sm" title="Edit" style={{ padding: '6px 10px', minWidth: 'auto' }}>Edit</button>
                                                <button onClick={() => handleDelete(item._id)} className="btn btn--secondary btn--sm" title="Delete" style={{ padding: '6px 10px', minWidth: 'auto', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'var(--danger)' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Blocked Entries Log */}
            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Blocked Manifest Entries</span>
                    {blockedTotal > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {blockedTotal} total blocked
                        </span>
                    )}
                </div>

                {blockedLoading ? (
                    <p className="card__empty">Loading blocked entries...</p>
                ) : blockedEntries.length === 0 ? (
                    <p className="card__empty">No blocked entries recorded yet. Entries excluded during manifest upload will appear here.</p>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Customer Code</th>
                                    <th>Passenger Name</th>
                                    <th>Email</th>
                                    <th>Reason</th>
                                    <th>Manifest Source</th>
                                    <th>Blocked On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blockedEntries.map((entry) => (
                                    <tr key={entry._id}>
                                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--danger)', fontSize: '13px' }}>
                                            {entry.extra?.CustomerCode || entry.extra?.['Customer Code'] || '—'}
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{entry.name || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{entry.email || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {entry.extra?.RestrictedReason || entry.status || '—'}
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {entry.manifestId?.name || '—'}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,0.85)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '16px', backdropFilter: 'blur(8px)'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '440px', marginBottom: 0, border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                        <div className="card__header" style={{ borderBottom: '1px solid var(--border-dim)', marginBottom: '16px' }}>
                            <h3 className="card__title">{editingEntry ? 'Edit Restriction' : 'New Restriction'}</h3>
                        </div>
                        <div className="card__body">
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <p className="text-secondary text-sm" style={{ marginBottom: '4px' }}>Fill in any field. A match will block the request.</p>
                                <div className="form-group">
                                    <label className="form-label">Customer Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.customerCode}
                                        onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                                        placeholder="e.g. V825 or VAFF* (prefix)"
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
                                        Use <code style={{ color: 'var(--accent)' }}>*</code> suffix for prefix matching — e.g. <code style={{ color: 'var(--accent)' }}>VLV*</code> blocks all codes starting with VLV
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Passenger Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.passengerName}
                                        onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: 500 }}>Reason</label>
                                    <textarea
                                        className="form-control"
                                        style={{ height: '80px', background: '#141414', borderRadius: '6px', padding: '10px' }}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Internal note..."
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary flex-1">Cancel</button>
                                    <button type="submit" className="btn btn--primary flex-1">
                                        {editingEntry ? 'Save Changes' : 'Add to List'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
