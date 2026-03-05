'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState({
        sms: '',
        emailSubject: '',
        emailBody: '',
        reminder: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            setLoading(true);
            const data = await api.get('/api/settings');
            if (data.templates) {
                setTemplates(data.templates);
            }
        } catch (err) {
            console.error('Failed to fetch templates', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            await api.patch('/api/settings', { templates });
            setStatus({ type: 'success', message: 'Templates saved successfully!' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message || 'Failed to save templates' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="card__empty" style={{ padding: '48px' }}>Loading templates...</p>;

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Review Templates</h1>
                <button onClick={handleSave} disabled={saving} className="btn btn--primary" style={{ padding: '10px 24px', borderRadius: '8px' }}>
                    {saving ? 'Saving...' : 'Save Templates'}
                </button>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '32px' }}>
                Customize the messages sent to your customers.
            </p>

            {status.message && (
                <div className={`mb-6 p-4 rounded-lg border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`} style={{ marginBottom: '24px' }}>
                    {status.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 300px) 1fr', gap: '32px' }}>
                <aside>
                    <div className="card" style={{ background: 'var(--blue-50)', borderColor: 'var(--blue-200)', borderStyle: 'dashed' }}>
                        <div className="card__body" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue-800)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                Variables
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--blue-700)', lineHeight: '1.5', marginBottom: '16px' }}>
                                Copy and paste these tags into your templates. They will be replaced with real data when sending.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--blue-100)' }}>
                                    <code style={{ fontSize: '13px', color: 'var(--blue-600)', fontWeight: 700 }}>{'{PassengerName}'}</code>
                                    <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>First name or full name</p>
                                </div>
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--blue-100)' }}>
                                    <code style={{ fontSize: '13px', color: 'var(--blue-600)', fontWeight: 700 }}>{'{DriverName}'}</code>
                                    <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>Name of the assigned driver</p>
                                </div>
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--blue-100)' }}>
                                    <code style={{ fontSize: '13px', color: 'var(--blue-600)', fontWeight: 700 }}>{'{ReviewLink}'}</code>
                                    <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>The rating link (REQUIRED)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* SMS */}
                    <section className="card">
                        <div className="card__header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            SMS Template
                        </div>
                        <div className="card__body">
                            <textarea
                                className="form-control"
                                style={{ height: '100px', padding: '12px', fontSize: '14px', lineHeight: '1.6' }}
                                value={templates.sms}
                                onChange={(e) => setTemplates({ ...templates, sms: e.target.value })}
                                placeholder="Hi {PassengerName}, thank you for riding with us..."
                            ></textarea>
                            <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '8px' }}>Try to keep it under 160 characters for a single SMS message.</p>
                        </div>
                    </section>

                    {/* Email */}
                    <section className="card">
                        <div className="card__header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                            Email Template
                        </div>
                        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Subject Line</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={templates.emailSubject}
                                    onChange={(e) => setTemplates({ ...templates, emailSubject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Message Body</label>
                                <textarea
                                    className="form-control"
                                    style={{ height: '280px', padding: '16px', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}
                                    value={templates.emailBody}
                                    onChange={(e) => setTemplates({ ...templates, emailBody: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {/* Reminder */}
                    <section className="card">
                        <div className="card__header">Reminder Message (SMS)</div>
                        <div className="card__body">
                            <textarea
                                className="form-control"
                                style={{ height: '80px', padding: '12px' }}
                                value={templates.reminder}
                                onChange={(e) => setTemplates({ ...templates, reminder: e.target.value })}
                                placeholder="We noticed you haven't rated us yet..."
                            ></textarea>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
