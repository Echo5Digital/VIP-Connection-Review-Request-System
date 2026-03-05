'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStaffContext } from '../StaffContext';

export default function TemplatesPage() {
    const router = useRouter();
    const { user, loading: ctxLoading } = useStaffContext();

    useEffect(() => {
        if (!ctxLoading && user?.role !== 'manager') {
            router.replace('/staff/dashboard');
        }
    }, [user, ctxLoading]);

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

    if (ctxLoading || user?.role !== 'manager') return null;
    if (loading) return <p className="card__empty" style={{ padding: '48px' }}>Loading templates...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>Review Templates</h1>
                    <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
                        Customize the messages sent to your customers.
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn--primary btn--sm">
                    {saving ? 'Saving...' : 'Save Templates'}
                </button>
            </div>

            {status.message && (
                <div className={status.type === 'success' ? 'form-success mb-6' : 'form-error mb-6'}>
                    {status.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) 1fr', gap: '32px' }}>
                <aside>
                    <div className="card" style={{ border: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.01)', height: 'fit-content' }}>
                        <div className="card__body" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Variables</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                                Use these tags in your templates. They will be replaced automatically.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ background: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                                    <code style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{'{PassengerName}'}</code>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>First or full name</p>
                                </div>
                                <div style={{ background: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                                    <code style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{'{DriverName}'}</code>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Assigned driver name</p>
                                </div>
                                <div style={{ background: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                                    <code style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{'{ReviewLink}'}</code>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Rating link (REQUIRED)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <section className="card">
                        <div className="card__header"><h3 className="card__title">SMS Template</h3></div>
                        <div className="card__body">
                            <textarea
                                className="form-control"
                                style={{ height: '100px', padding: '14px', fontSize: '14px', lineHeight: '1.6', background: '#141414', borderRadius: '8px', width: '100%', border: '1px solid var(--border-dim)' }}
                                value={templates.sms}
                                onChange={(e) => setTemplates({ ...templates, sms: e.target.value })}
                                placeholder="Hi {PassengerName}, thank you for riding with us..."
                            ></textarea>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Recommended length: under 160 characters.</p>
                        </div>
                    </section>

                    <section className="card">
                        <div className="card__header"><h3 className="card__title">Email Template</h3></div>
                        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 500, fontSize: '13px' }}>Subject Line</label>
                                <input type="text" className="form-control" style={{ background: '#141414', height: '36px', borderRadius: '6px' }} value={templates.emailSubject} onChange={(e) => setTemplates({ ...templates, emailSubject: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 500, fontSize: '13px' }}>Message Body</label>
                                <textarea
                                    className="form-control"
                                    style={{ height: '280px', padding: '14px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#141414', borderRadius: '8px', width: '100%', border: '1px solid var(--border-dim)' }}
                                    value={templates.emailBody}
                                    onChange={(e) => setTemplates({ ...templates, emailBody: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    <section className="card">
                        <div className="card__header"><h3 className="card__title">Reminder Message (SMS)</h3></div>
                        <div className="card__body">
                            <textarea
                                className="form-control"
                                style={{ height: '80px', padding: '14px', fontSize: '14px', lineHeight: '1.6', background: '#141414', borderRadius: '8px', width: '100%', border: '1px solid var(--border-dim)' }}
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
