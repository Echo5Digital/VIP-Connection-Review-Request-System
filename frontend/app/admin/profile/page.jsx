'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/api/auth/change-password', formData);
            setStatus({ type: 'success', message: 'Password changed successfully!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.message || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <h1 className="page-title">Profile Settings</h1>

            <div className="card" style={{ maxWidth: '500px' }}>
                <div className="card__header">Change Password</div>
                <div className="card__body">
                    <form className="form-group" style={{ gap: '20px' }} onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                                type="password"
                                className="form-input"
                                required
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                required
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                            <span className="text-xs text-muted">Must be at least 8 characters with upper/lower case and a number.</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>

                        {status.message && (
                            <div className={status.type === 'success' ? 'form-success' : 'form-error'} style={{ padding: '4px 0' }}>
                                {status.message}
                            </div>
                        )}

                        <button type="submit" className="btn btn--primary" disabled={loading} style={{ marginTop: '8px' }}>
                            {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
