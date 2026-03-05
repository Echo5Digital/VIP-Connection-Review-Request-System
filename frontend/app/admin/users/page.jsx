'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'client',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const data = await api.get('/api/users');
            setUsers(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/api/users', formData);
            setSuccess('User created successfully');
            setIsModalOpen(false);
            fetchUsers();
            setFormData({ name: '', email: '', password: '', role: 'client' });
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(role, id) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/api/users/${role}/${id}`);
            setSuccess('User deleted');
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>User Management</h1>
                <button onClick={() => setIsModalOpen(true)} className="btn btn--primary" style={{ borderRadius: '6px' }}>
                    Add New User
                </button>
            </div>

            {error && <div className="form-error mb-4" style={{ padding: '12px', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success-600)', background: 'var(--success-50)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

            <div className="card">
                <div className="card__header">Admins & Clients</div>

                {loading ? (
                    <p className="card__empty">Loading users...</p>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td style={{ fontWeight: 500 }}>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'admin' ? 'badge--purple' : 'badge--blue'}`} style={{ textTransform: 'uppercase' }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(user.role, user._id)}
                                                className="btn btn--sm btn--outline"
                                                style={{ color: '#dc2626' }}
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

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
                        <div className="card__header">Add New User</div>
                        <div className="card__body">
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-control"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Initial Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="form-control"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-control"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="client">Client</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--outline btn--sm">Cancel</button>
                                    <button type="submit" className="btn btn--primary btn--sm px-6">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
