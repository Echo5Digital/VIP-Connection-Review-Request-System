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
        <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: '4px' }}>Users</h1>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Manage system access for admins and clients</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn--primary" style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 600 }}>
                    + Add New User
                </button>
            </div>

            {error && <div className="form-error" style={{ marginBottom: '16px', padding: '12px', border: '1px solid var(--red-200)', background: 'var(--red-50)' }}>{error}</div>}
            {success && <div style={{ color: 'var(--success-600)', background: 'var(--success-50)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', border: '1px solid var(--success-200)' }}>{success}</div>}

            <div className="card" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card__header" style={{ padding: '24px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: '1.1rem' }}>
                    User Directory
                </div>

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <p className="card__empty" style={{ color: 'var(--gray-400)', fontSize: '1rem' }}>Loading users...</p>
                    </div>
                ) : (
                    <div className="table-wrap" style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead style={{ backgroundColor: 'var(--gray-50)' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px' }}>Name</th>
                                    <th>Email Address</th>
                                    <th>Role</th>
                                    <th>Joined Date</th>
                                    <th style={{ textAlign: 'right', padding: '16px 24px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--gray-900)' }}>{user.name}</td>
                                        <td style={{ color: 'var(--gray-600)' }}>{user.email}</td>
                                        <td>
                                            <span style={{
                                                background: user.role === 'admin' ? 'var(--blue-50)' : 'var(--green-50)',
                                                color: user.role === 'admin' ? 'var(--blue-700)' : 'var(--green-700)',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--gray-500)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'right', padding: '16px 24px' }}>
                                            <button
                                                onClick={() => handleDelete(user.role, user._id)}
                                                className="btn btn--outline btn--sm"
                                                style={{ color: 'var(--red-600)', borderColor: 'var(--red-100)', backgroundColor: 'var(--red-50)', borderRadius: '6px', fontWeight: 500 }}
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
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '440px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '20px' }}>
                        <div className="card__header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--gray-100)', fontSize: '1.25rem', fontWeight: 700 }}>Add New User</div>
                        <div className="card__body" style={{ padding: '32px' }}>
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-control"
                                        style={{ height: '48px', borderRadius: '10px' }}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-control"
                                        style={{ height: '48px', borderRadius: '10px' }}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Initial Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="form-control"
                                        style={{ height: '48px', borderRadius: '10px' }}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Role</label>
                                    <select
                                        className="form-control"
                                        style={{ height: '48px', borderRadius: '10px' }}
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="client">Client</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--outline" style={{ height: '48px', padding: '0 24px', borderRadius: '10px' }}>Cancel</button>
                                    <button type="submit" className="btn btn--primary" style={{ height: '48px', padding: '0 32px', borderRadius: '10px' }}>Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

