'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const [formData, setFormData] = useState({ name: '', email: '', password: '', active: true });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        setLoading(true);
        try {
            const data = await api.get('/api/clients');
            setClients(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    }

    function handleOpenModal(client = null) {
        if (client) {
            setEditingClient(client);
            setFormData({ name: client.name || '', email: client.email || '', password: '', active: client.active });
        } else {
            setEditingClient(null);
            setFormData({ name: '', email: '', password: '', active: true });
        }
        setFormError('');
        setShowPassword(false);
        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
        setEditingClient(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            const payload = { ...formData };
            if (!payload.password && editingClient) {
                delete payload.password; // Ignore password if empty on edit
            }

            if (editingClient) {
                await api.put(`/api/clients/${editingClient._id}`, payload);
            } else {
                await api.post('/api/clients', payload);
            }

            await fetchClients();
            handleCloseModal();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save client');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await api.delete(`/api/clients/${id}`);
            await fetchClients();
        } catch (err) {
            window.alert(err instanceof Error ? err.message : 'Failed to delete client');
        }
    }

    return (
        <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: '4px' }}>Clients</h1>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Manage system access for client accounts</p>
                </div>
                <button className="btn btn--primary" onClick={() => handleOpenModal()} style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 600 }}>
                    + Add Client
                </button>
            </div>

            {error ? (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--red-50)', color: 'var(--red-600)', borderRadius: '12px', border: '1px solid var(--red-200)' }}>
                    {error}
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                    <p className="text-muted">Loading clients...</p>
                </div>
            ) : (
                <div className="card" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card__header" style={{ padding: '24px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: '1.1rem' }}>
                        Client Directory
                    </div>
                    {clients.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                            <p className="card__empty" style={{ color: 'var(--gray-400)', fontSize: '1rem' }}>No clients found in the system.</p>
                        </div>
                    ) : (
                        <div className="table-wrap" style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead style={{ backgroundColor: 'var(--gray-50)' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px' }}>Client Info</th>
                                        <th>Email Address</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th style={{ textAlign: 'right', padding: '16px 24px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => (
                                        <tr key={client._id} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{client.name || '—'}</div>
                                            </td>
                                            <td style={{ color: 'var(--gray-600)' }}>{client.email}</td>
                                            <td>
                                                {client.active ? (
                                                    <span style={{
                                                        background: 'var(--green-50)',
                                                        color: '#166534',
                                                        padding: '6px 14px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        background: 'var(--red-50)',
                                                        color: '#991b1b',
                                                        padding: '6px 14px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                                                        Disabled
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--gray-500)' }}>{new Date(client.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                            <td style={{ textAlign: 'right', padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn--outline btn--sm"
                                                        style={{ borderRadius: '6px', fontWeight: 500 }}
                                                        onClick={() => handleOpenModal(client)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn--outline btn--sm"
                                                        style={{ color: 'var(--red-600)', borderColor: 'var(--red-100)', backgroundColor: 'var(--red-50)', borderRadius: '6px', fontWeight: 500 }}
                                                        onClick={() => handleDelete(client._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '440px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '20px' }}>
                        <div className="card__header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--gray-100)', fontSize: '1.25rem', fontWeight: 700 }}>
                            {editingClient ? 'Edit Client Details' : 'Register New Client'}
                        </div>
                        <div className="card__body" style={{ padding: '32px' }}>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter client name"
                                        style={{ height: '48px', borderRadius: '10px' }}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        placeholder="name@example.com"
                                        style={{ height: '48px', borderRadius: '10px' }}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                                        Account Password {editingClient && <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: '0.85rem' }}>(optional)</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-input"
                                            required={!editingClient}
                                            minLength={8}
                                            placeholder={editingClient ? "Leave blank to keep current" : "Minimum 8 characters"}
                                            style={{ height: '48px', borderRadius: '10px', paddingRight: '48px' }}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--gray-400)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '4px'
                                            }}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', backgroundColor: 'var(--gray-50)', padding: '12px 16px', borderRadius: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="clientActive"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary-600)' }}
                                    />
                                    <label htmlFor="clientActive" style={{ cursor: 'pointer', margin: 0, fontWeight: 500, color: 'var(--gray-700)' }}>Account is active</label>
                                </div>

                                {formError && <p className="form-error" style={{ marginBottom: '20px', padding: '10px', background: 'var(--red-50)', borderRadius: '6px', fontSize: '0.9rem' }}>{formError}</p>}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn--outline" onClick={handleCloseModal} style={{ height: '48px', padding: '0 24px', borderRadius: '10px', fontWeight: 600 }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn--primary" disabled={submitting} style={{ height: '48px', padding: '0 32px', borderRadius: '10px', fontWeight: 600 }}>
                                        {submitting ? 'Processing...' : (editingClient ? 'Update Client' : 'Add Client')}
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
