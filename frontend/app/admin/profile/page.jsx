'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        reviewPlatforms: { google: '', yelp: '', tripAdvisor: '' },
        templates: {
            sms: '',
            emailSubject: '',
            emailBody: '',
            reminder: ''
        },
        branding: {
            companyName: '',
            logo: '',
            themeColors: { primary: '#22c55e' }
        }
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            setLoading(true);
            const data = await api.get('/api/settings');
            setSettings({
                reviewPlatforms: data.reviewPlatforms || { google: '', yelp: '', tripAdvisor: '' },
                templates: data.templates || { sms: '', emailSubject: '', emailBody: '', reminder: '' },
                branding: data.branding || { companyName: '', logo: '', themeColors: { primary: '#22c55e' } }
            });
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSettingsSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            await api.patch('/api/settings', settings);
            setStatus({ type: 'success', message: 'Settings saved successfully!' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/auth/change-password', passwordForm);
            setStatus({ type: 'success', message: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="card__empty" style={{ padding: '48px' }}>Loading settings...</p>;

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            <h1 className="page-title">System Settings</h1>

            {status.message && (
                <div className={status.type === 'success' ? 'form-success' : 'form-error'} style={{ marginBottom: '24px', padding: '12px', border: '1px solid currentColor', borderRadius: '6px', background: status.type === 'success' ? 'var(--success-50)' : 'var(--red-50)' }}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Review Platforms */}
                <section className="card">
                    <div className="card__header">Review Platform Settings</div>
                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label className="form-label">Google Review URL</label>
                            <input
                                type="url"
                                className="form-control"
                                value={settings.reviewPlatforms.google}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    reviewPlatforms: { ...settings.reviewPlatforms, google: e.target.value }
                                })}
                                placeholder="https://g.page/r/..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Yelp Review URL</label>
                            <input
                                type="url"
                                className="form-control"
                                value={settings.reviewPlatforms.yelp}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    reviewPlatforms: { ...settings.reviewPlatforms, yelp: e.target.value }
                                })}
                                placeholder="https://www.yelp.com/biz/..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">TripAdvisor Review URL</label>
                            <input
                                type="url"
                                className="form-control"
                                value={settings.reviewPlatforms.tripAdvisor}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    reviewPlatforms: { ...settings.reviewPlatforms, tripAdvisor: e.target.value }
                                })}
                                placeholder="https://www.tripadvisor.com/..."
                            />
                        </div>
                    </div>
                </section>

                {/* Branding */}
                <section className="card">
                    <div className="card__header">Branding</div>
                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.branding.companyName}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    branding: { ...settings.branding, companyName: e.target.value }
                                })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Theme Primary Color</label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    style={{ width: '60px', height: '40px', padding: '2px', borderRadius: '4px', border: '1px solid var(--gray-300)' }}
                                    value={settings.branding.themeColors.primary}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        branding: {
                                            ...settings.branding,
                                            themeColors: { ...settings.branding.themeColors, primary: e.target.value }
                                        }
                                    })}
                                />
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ maxWidth: '120px' }}
                                    value={settings.branding.themeColors.primary}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        branding: {
                                            ...settings.branding,
                                            themeColors: { ...settings.branding.themeColors, primary: e.target.value }
                                        }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ padding: '12px 32px', fontSize: '15px' }}>
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>

            <div style={{ height: '40px' }}></div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)', margin: '40px 0' }} />

            {/* Password Management */}
            <section className="card" style={{ maxWidth: '480px' }}>
                <div className="card__header">Security / Change Password</div>
                <div className="card__body">
                    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                        </div>
                        <button type="submit" disabled={saving} className="btn btn--outline" style={{ marginTop: '8px' }}>
                            Update Password
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
