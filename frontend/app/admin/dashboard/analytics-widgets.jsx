import Link from 'next/link';
import './analytics-widgets.css';

export function FunnelMetricsWidget({ data }) {
    const metrics = [
        { label: 'Requests Sent', value: data.requestsSent },
        { label: 'Delivered', value: data.delivered },
        { label: 'Ratings Submitted', value: data.ratingsSubmitted },
        { label: '5★ Driver & Vehicle', value: data.fiveStarDriverVehicle },
        { label: 'Public Review Clicks', value: data.publicReviewClicks },
        { label: 'Private Feedback', value: data.privateFeedback },
    ];

    const maxVal = data.requestsSent || 1;

    return (
        <div className="card">
            <div className="widget-header">
                <h3 className="card__title">Review Funnel Metrics</h3>
                <Link href="/admin/manifest" className="btn btn--secondary btn--sm">View Trips →</Link>
            </div>
            <div className="funnel-container">
                {metrics.map((m, i) => {
                    const percentageFull = maxVal > 0 ? (m.value / maxVal) * 100 : 0;
                    const displayPercentage = maxVal > 0 ? Math.round((m.value / maxVal) * 100) : 0;

                    return (
                        <div key={i} className="funnel-row">
                            <div className="funnel-label">{m.label}</div>
                            <div className="funnel-bar-wrapper">
                                <div className="funnel-bar-bg">
                                    <div
                                        className="funnel-bar-fill"
                                        style={{
                                            width: `${Math.max(percentageFull, 5)}%`,
                                        }}
                                    >
                                        {m.value > 0 && <span className="funnel-bar-count">{m.value.toLocaleString()}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="funnel-percentage">{displayPercentage}%</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


export function ConversionMetricsWidget({ data }) {
    return (
        <div className="card">
            <h3 className="card__title widget-header">Conversion Rates</h3>
            <div className="widget-flex-col">
                <div className="widget-stat-box">
                    <span className="widget-subhead" style={{ marginBottom: '8px' }}>Sent → Rated Conversion %</span>
                    <div className="stat-card__value" style={{ color: 'var(--accent)' }}>{data.sentRateConversion}%</div>
                </div>
                <div className="widget-stat-box">
                    <span className="widget-subhead" style={{ marginBottom: '8px' }}>Rated → Public Clicks %</span>
                    <div className="stat-card__value" style={{ color: 'var(--accent)' }}>{data.clickConversion}%</div>
                </div>
            </div>
        </div>
    );
}

export function DriverPerformanceWidget({ data }) {
    return (
        <div className="card">
            <div className="widget-header">
                <h3 className="card__title">Driver Performance</h3>
                <Link href="/admin/drivers" className="btn btn--secondary btn--sm">Manage Drivers →</Link>
            </div>
            <div className="widget-grid widget-grid-2">
                <div>
                    <h4 className="widget-subhead">Top Drivers</h4>
                    {data.topDrivers.length === 0 ? (
                        <p className="widget-empty">No top drivers yet.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="widget-table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th style={{ textAlign: 'center' }}>Rating</th>
                                        <th style={{ textAlign: 'center' }}>Trips</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topDrivers.map((d, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{d.name}</td>
                                            <td style={{ textAlign: 'center' }}><span className="badge badge--green">★ {d.avgRating}</span></td>
                                            <td style={{ textAlign: 'center' }}>{d.ratedTrips}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div>
                    <h4 className="widget-subhead">Drivers Needing Attention</h4>
                    {data.attentionDrivers.length === 0 ? (
                        <p className="widget-empty">No drivers need attention.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="widget-table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th style={{ textAlign: 'center' }}>Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.attentionDrivers.map((d, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{d.name}</td>
                                            <td style={{ textAlign: 'center' }}><span className="badge badge--red">★ {d.avgRating}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function VehiclePerformanceWidget({ data }) {
    return (
        <div className="card">
            <h3 className="card__title widget-header">Vehicle Performance</h3>
            <div className="widget-body">
                {data.length === 0 ? (
                    <p className="widget-empty">No vehicle ratings yet.</p>
                ) : (
                    <div className="table-wrap">
                        <table className="widget-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Type</th>
                                    <th style={{ textAlign: 'center' }}>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((v, i) => (
                                    <tr key={i}>
                                        <td className="font-medium">{v.type}</td>
                                        <td style={{ textAlign: 'center' }}><span className="badge badge--gold">★ {v.avgRating}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export function NegativeFeedbackWidget({ data }) {
    return (
        <div className="card">
            <div className="widget-header">
                <h3 className="card__title">Action Required: Unresolved Feedback</h3>
                <Link href="/admin/feedback" className="btn btn--danger btn--sm" style={{ background: 'var(--danger)' }}>Go to Feedback →</Link>
            </div>
            <div className="widget-grid widget-grid-2">
                <div>
                    <div className="widget-subhead">Unresolved Feedback Aging</div>
                    <div className="widget-flex-col">
                        <div className="aging-row gray-box">
                            <span className="font-medium">0–2 days</span>
                            <span className="badge badge--gold" style={{ background: 'rgba(201, 162, 74, 0.2)', border: '1px solid var(--accent)' }}>{data.days_0_2}</span>
                        </div>
                        <div className="aging-row gray-box">
                            <span className="font-medium">3–7 days</span>
                            <span className="badge badge--gold" style={{ background: 'rgba(201, 162, 74, 0.2)', border: '1px solid var(--accent)' }}>{data.days_3_7}</span>
                        </div>
                        <div className="aging-row red-box" style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                            <span className="font-medium" style={{ color: 'var(--danger)' }}>8+ days</span>
                            <span className="badge badge--red" style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid var(--danger)' }}>{data.days_8_plus}</span>
                        </div>
                    </div>
                </div>
                <div className="widget-actions">
                    <div className="widget-subhead">Quick Actions</div>
                    <button className="btn btn--primary">Assign Feedback</button>
                    <button className="btn btn--secondary">Mark as Resolved</button>
                    <Link href="/admin/feedback" className="btn btn--secondary" style={{ textAlign: 'center' }}>Email Passenger</Link>
                </div>
            </div>
        </div>
    );
}
