'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStaffContext } from '../StaffContext';

function getRoleBadgeClass(role) {
    switch (role) {
        case 'manager': return 'badge--blue';
        case 'dispatcher': return 'badge--green';
        default: return 'badge--gray';
    }
}

export default function UsersPage() {
    const router = useRouter();
    const { user: currentUser, loading: ctxLoading } = useStaffContext();

    useEffect(() => {
        if (!ctxLoading) {
            // Users page is admin-only; redirect all staff to role-appropriate home
            const target = currentUser?.role === 'manager' ? '/staff/dashboard' : '/staff/manifest';
            router.replace(target);
        }
    }, [currentUser, ctxLoading]);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'dispatcher',
        active: true,
    });

    useEffect(() => {
        if (!ctxLoading && currentUser?.role === 'manager') {
            fetchUsers();
        }
    }, [ctxLoading, currentUser]);

    async function fetchUsers() {
        try {
            setLoading(true);
            const data = await api.get('/api/users');
            // Filter out admin users (backend also enforces this, but double-check on frontend)
            setUsers((data || []).filter(u => u.role !== 'admin'));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openAddModal() {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'dispatcher', active: true });
        setIsModalOpen(true);
    }

    function openEditModal(user) {
        setEditingUser(user);
        setFormData({ name: user.name || '', email: user.email, password: '', role: user.role, active: user.active ?? true });
        setIsModalOpen(true);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingUser) {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await api.put(`/api/users/${editingUser.role}/${editingUser._id}`, updateData);
                setSuccess('User updated successfully');
            } else {
                await api.post('/api/users', formData);
                setSuccess('User created successfully');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(user) {
        if (!confirm(`Are you sure you want to delete ${user.name || user.email}?`)) return;
        try {
            await api.delete(`/api/users/${user.role}/${user._id}`);
            setSuccess('User removed');
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    }

    if (ctxLoading) return null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Users</h1>
                <button onClick={openAddModal} className="btn btn--primary btn--sm">+ Add User</button>
            </div>

            {error && <div className="form-error mb-4">{error}</div>}
            {success && <div className="form-success mb-4">{success}</div>}

            <div className="card">
                <div className="card__header">Staff Users</div>

                {loading ? (
                    <p className="card__empty">Loading users...</p>
                ) : users.length === 0 ? (
                    <p className="card__empty">No users found.</p>
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
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(u.role)}`} style={{ textTransform: 'capitalize' }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.active !== false ? 'badge--green' : 'badge--red'}`}>
                                                {u.active !== false ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => openEditModal(u)} className="btn btn--secondary btn--sm">Edit</button>
                                                <button onClick={() => handleDelete(u)} className="btn btn--secondary btn--sm" style={{ borderColor: 'rgba(220,38,38,0.3)', color: 'var(--danger)' }}>Delete</button>
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
                    <div className="card" style={{ width: '100%', maxWidth: '480px', marginBottom: 0, border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                        <div className="card__header" style={{ borderBottom: '1px solid var(--border-dim)', marginBottom: '16px' }}>
                            <h3 className="card__title">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        </div>
                        <div className="card__body">
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input type="email" required className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                                    <input type="password" className="form-control" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-control" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="manager">Manager</option>
                                        <option value="dispatcher">Dispatcher</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="checkbox" id="active-check" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                                    <label htmlFor="active-check" className="form-label" style={{ margin: 0 }}>Active</label>
                                </div>

                                {error && <div className="form-error">{error}</div>}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn--secondary">Cancel</button>
                                    <button type="submit" className="btn btn--primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
