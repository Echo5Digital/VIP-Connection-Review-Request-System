'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function StatusBadge({ status }) {
    if (status === 'top') {
        return <span className="badge badge--green">⭐ Top Performer</span>;
    }
    if (status === 'attention') {
        return <span className="badge badge--red">⚠ Needs Attention</span>;
    }
    return <span className="badge badge--gold">— Average</span>;
}

function RatingBadge({ rating, status }) {
    const cls = status === 'top' ? 'badge--green' : status === 'attention' ? 'badge--red' : 'badge--gold';
    return <span className={`badge ${cls}`}>★ {rating}</span>;
}

export default function DriverProductivityPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/dashboard/productivity')
            .then(setData)
            .catch(() => setError('Failed to load driver productivity data.'));
    }, []);

    return (
        <div style={{ padding: '32px 24px', maxWidth: 1100 }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Driver Productivity
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
                    Performance overview of drivers and vehicles
                </p>
            </div>

            {error && (
                <div style={{ color: 'var(--danger)', marginBottom: 20 }}>{error}</div>
            )}

            {!data && !error && (
                <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
            )}

            {data && (
                <>
                    {/* Driver Performance Table */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="widget-header">
                            <h3 className="card__title">Driver Performance</h3>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {data.drivers.length} driver{data.drivers.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {data.drivers.length === 0 ? (
                            <p className="card__empty">No driver data yet.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Driver Name</th>
                                            <th style={{ textAlign: 'center' }}>Total Trips</th>
                                            <th style={{ textAlign: 'center' }}>Avg Rating</th>
                                            <th style={{ textAlign: 'center' }}>Complaints</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.drivers.map((d, i) => (
                                            <tr key={i}>
                                                <td className="font-medium">{d.name}</td>
                                                <td style={{ textAlign: 'center' }}>{d.ratedTrips}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <RatingBadge rating={d.avgRating} status={d.status} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {d.complaints > 0
                                                        ? <span className="badge badge--red">{d.complaints}</span>
                                                        : <span style={{ color: 'var(--text-muted)' }}>0</span>
                                                    }
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <StatusBadge status={d.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Vehicle Performance Table */}
                    <div className="card">
                        <div className="widget-header">
                            <h3 className="card__title">Vehicle Performance</h3>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {data.vehicles.length} vehicle type{data.vehicles.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {data.vehicles.length === 0 ? (
                            <p className="card__empty">No vehicle data yet.</p>
                        ) : (
                            <div className="table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Vehicle Type</th>
                                            <th style={{ textAlign: 'center' }}>Trips</th>
                                            <th style={{ textAlign: 'center' }}>Avg Rating</th>
                                            <th style={{ textAlign: 'center' }}>Drivers Assigned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.vehicles.map((v, i) => (
                                            <tr key={i}>
                                                <td className="font-medium">{v.type}</td>
                                                <td style={{ textAlign: 'center' }}>{v.ratedTrips}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="badge badge--gold">★ {v.avgRating}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{v.driversAssigned}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
