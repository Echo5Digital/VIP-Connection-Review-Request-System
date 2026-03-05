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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Review Templates</h1>
                <button onClick={handleSave} disabled={saving} className="btn btn--primary">
                    {saving ? 'Saving...' : 'Save Templates'}
                </button>
            </div>
            <p className="text-muted text-sm mb-8">
                Customize the messages sent to your customers.
            </p>

            {status.message && (
                <div className={status.type === 'success' ? 'form-success mb-6' : 'form-error mb-6'}>
                    {status.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) 1fr', gap: '32px' }}>
                <aside>
                    <div className="card" style={{ border: '1px dashed var(--accent)', background: 'rgba(201, 162, 74, 0.05)', height: 'fit-content' }}>
                        <div className="card__body" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>💡</span> Variables
                            </h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                                Copy and paste these tags into your templates. They will be replaced with real data when sending.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
                                    <code style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>{'{PassengerName}'}</code>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>First name or full name</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
                                    <code style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>{'{DriverName}'}</code>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Name of the assigned driver</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
                                    <code style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>{'{ReviewLink}'}</code>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>The rating link (REQUIRED)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* SMS */}
                    <section className="card">
                        <div className="card__header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>💬</span> SMS Template
                        </div>
                        <div className="card__body">
                            <textarea
                                className="form-control"
                                style={{ height: '120px', padding: '16px', fontSize: '14px', lineHeight: '1.6', background: 'var(--bg-deep)', borderRadius: '10px' }}
                                value={templates.sms}
                                onChange={(e) => setTemplates({ ...templates, sms: e.target.value })}
                                placeholder="Hi {PassengerName}, thank you for riding with us..."
                            ></textarea>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>Avoid exceeding 160 characters for optimal delivery.</p>
                        </div>
                    </section>

                    {/* Email */}
                    <section className="card">
                        <div className="card__header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>✉️</span> Email Template
                        </div>
                        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Subject Line</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ background: 'var(--bg-deep)', height: '42px', borderRadius: '8px' }}
                                    value={templates.emailSubject}
                                    onChange={(e) => setTemplates({ ...templates, emailSubject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>Message Body</label>
                                <textarea
                                    className="form-control"
                                    style={{ height: '320px', padding: '16px', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', background: 'var(--bg-deep)', borderRadius: '12px' }}
                                    value={templates.emailBody}
                                    onChange={(e) => setTemplates({ ...templates, emailBody: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {/* Reminder */}
                    <section className="card">
                        <div className="card__header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>🔔</span> Reminder Message (SMS)
                        </div>
                        <div className="card__body">
                            <textarea
                                className="form-control"
                                style={{ height: '100px', padding: '16px', fontSize: '14px', lineHeight: '1.6', background: 'var(--bg-deep)', borderRadius: '10px' }}
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
