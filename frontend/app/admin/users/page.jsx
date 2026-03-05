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
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'manager',
        active: true,
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

    function openAddModal() {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'manager', active: true });
        setIsModalOpen(true);
    }

    function openEditModal(user) {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '', // Keep empty unless changing
            role: user.role,
            active: user.active !== false,
        });
        setIsModalOpen(true);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingUser) {
                // Update User
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;

                await api.put(`/api/users/${editingUser.role}/${editingUser._id}`, updateData);
                setSuccess('User updated successfully');
            } else {
                // Create User
                await api.post('/api/users', formData);
                setSuccess('User created successfully');
            }
            setIsModalOpen(false);
            fetchUsers();
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

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge--purple';
            case 'manager': return 'badge--blue';
            case 'dispatcher': return 'badge--green';
            default: return 'badge--gray';
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: 'var(--text-main)' }}>Users</h1>
                <button onClick={openAddModal} className="btn btn--primary btn--sm">
                    Add New User
                </button>
            </div>

            {error && <div className="form-error mb-4">{error}</div>}
            {success && <div className="form-success mb-4">{success}</div>}

            <div className="card">
                <div className="card__header">Admins, Managers & Dispatchers</div>

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
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} style={{ opacity: user.active === false ? 0.5 : 1 }}>
                                        <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.active !== false ? 'badge--green' : 'badge--red'}`}>
                                                {user.active !== false ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => openEditModal(user)} className="btn btn--secondary btn--sm" title="Edit" style={{ padding: '6px 10px', minWidth: 'auto' }}>Edit</button>
                                                <button onClick={() => handleDelete(user.role, user._id)} className="btn btn--secondary btn--sm" title="Delete" style={{ padding: '6px 10px', minWidth: 'auto', borderColor: 'rgba(220, 38, 38, 0.3)', color: 'var(--danger)' }}>Delete</button>
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
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,0.85)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '16px', backdropFilter: 'blur(8px)'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '440px', marginBottom: 0, border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                        <div className="card__header" style={{ borderBottom: '1px solid var(--border-dim)', marginBottom: '16px' }}>
                            <h3 className="card__title">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        </div>
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
                                        placeholder="Enter full name"
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
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{editingUser ? 'New Password (leave blank to keep current)' : 'Initial Password'}</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        className="form-control"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-control"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="manager">Manager</option>
                                        <option value="dispatcher">Dispatcher</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="user-active"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                    <label htmlFor="user-active" className="form-label" style={{ marginBottom: 0 }}>Active</label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary flex-1">Cancel</button>
                                    <button type="submit" className="btn btn--primary flex-1">
                                        {editingUser ? 'Save Changes' : 'Create User'}
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
