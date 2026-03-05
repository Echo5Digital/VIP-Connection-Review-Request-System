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


    if (loading) return <p className="card__empty" style={{ padding: '48px' }}>Loading settings...</p>;

    return (
        <div>
            <h1 className="page-title">Profile Settings</h1>

            {status.message && (
                <div className={status.type === 'success' ? 'form-success mb-6' : 'form-error mb-6'}>
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
                                    style={{
                                        width: '60px', height: '40px', padding: '2px',
                                        borderRadius: '8px', border: '1px solid var(--border-dim)',
                                        background: 'var(--bg-deep)', cursor: 'pointer'
                                    }}
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
                                    style={{ maxWidth: '140px' }}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ padding: '0 40px', height: '48px', fontSize: '15px', borderRadius: '12px' }}>
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
