'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStaffContext } from '../StaffContext';

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: ctxLoading } = useStaffContext();

    useEffect(() => {
        if (!ctxLoading && user?.role !== 'manager') {
            router.replace('/staff/dashboard');
        }
    }, [user, ctxLoading]);

    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [saving, setSaving] = useState(false);

    async function handleChangePassword(e) {
        e.preventDefault();
        if (passwords.next !== passwords.confirm) {
            setStatus({ type: 'error', message: 'New passwords do not match.' });
            return;
        }
        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            await api.post('/api/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.next,
            });
            setStatus({ type: 'success', message: 'Password changed successfully.' });
            setPasswords({ current: '', next: '', confirm: '' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Failed to change password.' });
        } finally {
            setSaving(false);
        }
    }

    if (ctxLoading || user?.role !== 'manager') return null;

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Settings</h1>
                <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>Manage your account settings.</p>
            </div>

            <div style={{ maxWidth: '480px' }}>
                <section className="card">
                    <div className="card__header">
                        <h3 className="card__title">Account Info</h3>
                    </div>
                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Name</label>
                            <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{user?.name || '—'}</p>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email</label>
                            <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{user?.email || '—'}</p>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Role</label>
                            <span className="badge badge--blue" style={{ textTransform: 'capitalize' }}>Manager</span>
                        </div>
                    </div>
                </section>

                <section className="card" style={{ marginTop: '24px' }}>
                    <div className="card__header">
                        <h3 className="card__title">Change Password</h3>
                    </div>
                    <div className="card__body">
                        {status.message && (
                            <div className={status.type === 'success' ? 'form-success mb-4' : 'form-error mb-4'}>
                                {status.message}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" required className="form-control" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input type="password" required className="form-control" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input type="password" required className="form-control" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" disabled={saving} className="btn btn--primary btn--sm">
                                    {saving ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
