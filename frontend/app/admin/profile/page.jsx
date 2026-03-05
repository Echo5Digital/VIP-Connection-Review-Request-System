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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Profile Settings</h1>
                <button type="submit" form="profile-form" disabled={saving} className="btn btn--primary btn--sm">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {status.message && (
                <div className={status.type === 'success' ? 'form-success mb-6' : 'form-error mb-6'}>
                    {status.message}
                </div>
            )}

            <form id="profile-form" onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Review Platforms */}
                <section className="card">
                    <div className="card__header" style={{ marginBottom: '16px' }}>
                        <h3 className="card__title">Review Platform Settings</h3>
                    </div>
                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: 500 }}>Google Review URL</label>
                            <input
                                type="url"
                                className="form-control"
                                value={settings.reviewPlatforms.google}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    reviewPlatforms: { ...settings.reviewPlatforms, google: e.target.value }
                                })}
                                placeholder="https://g.page/r/..."
                                style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: 500 }}>Yelp Review URL</label>
                            <input
                                type="url"
                                className="form-control"
                                value={settings.reviewPlatforms.yelp}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    reviewPlatforms: { ...settings.reviewPlatforms, yelp: e.target.value }
                                })}
                                placeholder="https://www.yelp.com/biz/..."
                                style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: 500 }}>TripAdvisor Review URL</label>
                            <input
                                type="url"
                                className="form-control"
                                value={settings.reviewPlatforms.tripAdvisor}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    reviewPlatforms: { ...settings.reviewPlatforms, tripAdvisor: e.target.value }
                                })}
                                placeholder="https://www.tripadvisor.com/..."
                                style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                            />
                        </div>
                    </div>
                </section>

                {/* Branding */}
                <section className="card">
                    <div className="card__header" style={{ marginBottom: '16px' }}>
                        <h3 className="card__title">Branding</h3>
                    </div>
                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: 500 }}>Company Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={settings.branding.companyName}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    branding: { ...settings.branding, companyName: e.target.value }
                                })}
                                style={{ background: '#141414', height: '36px', borderRadius: '6px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '13px', fontWeight: 500 }}>Theme Primary Color</label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    style={{
                                        width: '42px', height: '36px', padding: '2px',
                                        borderRadius: '6px', border: '1px solid var(--border-dim)',
                                        background: '#141414', cursor: 'pointer'
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
                                    style={{ maxWidth: '120px', background: '#141414', height: '36px', borderRadius: '6px' }}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                    <button type="submit" disabled={saving} className="btn btn--primary" style={{ padding: '0 32px' }}>
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
