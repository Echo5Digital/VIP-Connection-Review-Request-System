'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function RestrictionsPage() {
    const [restrictions, setRestrictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    useEffect(() => {
        fetchRestrictions();
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
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Restriction List</h1>
                <button onClick={openAddModal} className="btn btn--primary" style={{ borderRadius: '6px', fontWeight: 500 }}>
                    Add Restriction
                </button>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '24px' }}>
                Customers or passengers in this list will not receive review requests.
            </p>

            {error && <div className="form-error mb-4" style={{ padding: '12px', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success-600)', background: 'var(--success-50)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

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
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restrictions.map((item) => (
                                    <tr key={item._id}>
                                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{item.customerCode || '—'}</td>
                                        <td style={{ fontWeight: 500 }}>{item.passengerName || '—'}</td>
                                        <td>{item.email || '—'}</td>
                                        <td>{item.phone || '—'}</td>
                                        <td style={{ color: 'var(--gray-500)', fontSize: '12px' }}>{item.reason || '—'}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => openEditModal(item)} className="btn btn--sm btn--outline">Edit</button>
                                                <button onClick={() => handleDelete(item._id)} className="btn btn--sm btn--outline" style={{ color: '#dc2626' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '480px', marginBottom: 0 }}>
                        <div className="card__header">{editingEntry ? 'Edit Restriction' : 'New Restriction'}</div>
                        <div className="card__body">
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Fill in any combination of fields. A match on any field will block the review request.</p>
                                <div className="form-group">
                                    <label className="form-label">Customer Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.customerCode}
                                        onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                                        placeholder="e.g. V825"
                                    />
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
                                    <label className="form-label">Reason</label>
                                    <textarea
                                        className="form-control"
                                        style={{ height: '80px', py: '8px' }}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--outline btn--sm">Cancel</button>
                                    <button type="submit" className="btn btn--primary btn--sm px-6">{editingEntry ? 'Update' : 'Add to List'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
