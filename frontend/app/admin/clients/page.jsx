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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Clients</h1>
                <button className="btn btn--primary btn--sm" onClick={() => handleOpenModal()}>
                    Add Client
                </button>
            </div>

            {error ? (
                <p className="form-error">{error}</p>
            ) : loading ? (
                <p className="text-muted">Loading clients...</p>
            ) : (
                <div className="card">
                    <div className="card__header">Manage Client Access</div>
                    {clients.length === 0 ? (
                        <p className="card__empty">No clients found.</p>
                    ) : (
                        <div className="table-wrap" style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => (
                                        <tr key={client._id}>
                                            <td style={{ fontWeight: 500 }}>{client.name || '—'}</td>
                                            <td>{client.email}</td>
                                            <td>
                                                {client.active ? (
                                                    <span className="badge badge--green" style={{ background: 'var(--green-100)', color: 'var(--green-800)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>Active</span>
                                                ) : (
                                                    <span className="badge badge--red" style={{ background: 'var(--red-100)', color: 'var(--red-800)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>Disabled</span>
                                                )}
                                            </td>
                                            <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn--outline btn--sm"
                                                    style={{ marginRight: '8px' }}
                                                    onClick={() => handleOpenModal(client)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn--outline btn--sm"
                                                    style={{ color: 'var(--red-600)', borderColor: 'var(--red-200)' }}
                                                    onClick={() => handleDelete(client._id)}
                                                >
                                                    Delete
                                                </button>
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
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                        <div className="card__header">{editingClient ? 'Edit' : 'Add'} Client</div>
                        <div className="card__body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">
                                        Password {editingClient && <span style={{ fontWeight: 'normal', color: 'var(--gray-500)' }}>(Leave blank to keep)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        required={!editingClient}
                                        minLength={8}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <input
                                        type="checkbox"
                                        id="clientActive"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="clientActive" style={{ cursor: 'pointer', margin: 0 }}>Active Access</label>
                                </div>

                                {formError && <p className="form-error" style={{ marginBottom: '16px' }}>{formError}</p>}

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                    <button type="button" className="btn btn--outline" onClick={handleCloseModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn--primary" disabled={submitting}>
                                        {submitting ? 'Saving...' : 'Save'}
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
