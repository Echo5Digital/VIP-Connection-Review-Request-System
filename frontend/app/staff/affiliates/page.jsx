'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStaffContext } from '../StaffContext';

export default function AffiliatesPage() {
    const router = useRouter();
    const { user, loading: ctxLoading } = useStaffContext();

    useEffect(() => {
        if (!ctxLoading && user?.role !== 'manager') {
            router.replace('/staff/dashboard');
        }
    }, [user, ctxLoading]);

    const [affiliates, setAffiliates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAffiliate, setEditingAffiliate] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        fetchAffiliates();
    }, []);

    async function fetchAffiliates() {
        try {
            setLoading(true);
            const data = await api.get('/api/affiliates');
            setAffiliates(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openAddModal() {
        setEditingAffiliate(null);
        setFormData({ code: '', name: '', contactPerson: '', email: '', phone: '' });
        setIsModalOpen(true);
    }

    function openEditModal(aff) {
        setEditingAffiliate(aff);
        setFormData({
            code: aff.code,
            name: aff.name,
            contactPerson: aff.contactPerson || '',
            email: aff.email || '',
            phone: aff.phone || '',
        });
        setIsModalOpen(true);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingAffiliate) {
                await api.put(`/api/affiliates/${editingAffiliate._id}`, formData);
                setSuccess('Affiliate updated');
            } else {
                await api.post('/api/affiliates', formData);
                setSuccess('Affiliate added');
            }
            setIsModalOpen(false);
            fetchAffiliates();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this affiliate?')) return;
        try {
            await api.delete(`/api/affiliates/${id}`);
            fetchAffiliates();
            setSuccess('Affiliate removed');
        } catch (err) {
            setError(err.message);
        }
    }

    if (ctxLoading || user?.role !== 'manager') return null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Affiliates</h1>
                <button onClick={openAddModal} className="btn btn--primary btn--sm">Add Affiliate</button>
            </div>

            {error && <div className="form-error mb-4">{error}</div>}
            {success && <div className="form-success mb-4">{success}</div>}

            <div className="card">
                <div className="card__header">All Affiliates</div>

                {loading ? (
                    <p className="card__empty">Loading affiliates...</p>
                ) : affiliates.length === 0 ? (
                    <p className="card__empty">No affiliates found. Click Add Affiliate to begin.</p>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Contact Person</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Avg Rating</th>
                                    <th>Trips</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {affiliates.map((aff) => (
                                    <tr key={aff._id}>
                                        <td style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '13px' }}>{aff.code}</td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{aff.name}</td>
                                        <td>{aff.contactPerson || '—'}</td>
                                        <td>{aff.email || '—'}</td>
                                        <td>{aff.phone || '—'}</td>
                                        <td>
                                            <span className="badge badge--gold" style={{ padding: '4px 10px', fontSize: '12px' }}>
                                                {aff.avgRating?.toFixed(1) || '0.0'} ★
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{aff.tripsCount || 0}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => openEditModal(aff)} className="btn btn--secondary btn--sm" style={{ padding: '6px 10px', minWidth: 'auto' }}>Edit</button>
                                                <button onClick={() => handleDelete(aff._id)} className="btn btn--secondary btn--sm" style={{ padding: '6px 10px', minWidth: 'auto', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'var(--danger)' }}>Delete</button>
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
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(8px)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '440px', marginBottom: 0, border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                        <div className="card__header" style={{ borderBottom: '1px solid var(--border-dim)', marginBottom: '16px' }}>
                            <h3 className="card__title">{editingAffiliate ? 'Edit Affiliate' : 'Add New Affiliate'}</h3>
                        </div>
                        <div className="card__body">
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Affiliate Code *</label>
                                    <input type="text" required className="form-control" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. VIP-001" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Affiliate Name *</label>
                                    <input type="text" required className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input type="text" className="form-control" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary flex-1">Cancel</button>
                                    <button type="submit" className="btn btn--primary flex-1">{editingAffiliate ? 'Save Changes' : 'Create Affiliate'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
