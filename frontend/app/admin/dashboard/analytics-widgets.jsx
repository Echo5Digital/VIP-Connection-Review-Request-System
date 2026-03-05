import Link from 'next/link';
import './analytics-widgets.css';

export function FunnelMetricsWidget({ data }) {
    return (
        <div className="card">
            <h3 className="card__title widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Review Funnel Metrics
                <Link href="/admin/manifest" className="text-xs text-green-600 font-bold hover:underline">View Trips →</Link>
            </h3>
            <div className="widget-grid widget-grid-3">
                <div className="widget-stat-box blue-box">
                    <span className="stat-card__label">Requests Sent</span>
                    <div className="stat-card__value">{data.requestsSent}</div>
                </div>
                <div className="widget-stat-box gray-box">
                    <span className="stat-card__label">Delivered</span>
                    <div className="stat-card__value">{data.delivered}</div>
                </div>
                <div className="widget-stat-box blue-box">
                    <span className="stat-card__label">Ratings Submitted</span>
                    <div className="stat-card__value">{data.ratingsSubmitted}</div>
                </div>
                <div className="widget-stat-box blue-box">
                    <span className="stat-card__label" style={{ textTransform: 'none', fontWeight: 700 }}>5★ Driver & Vehicle</span>
                    <div className="stat-card__value">{data.fiveStarDriverVehicle}</div>
                </div>
                <div className="widget-stat-box gray-box">
                    <span className="stat-card__label">Public Review Clicks</span>
                    <div className="stat-card__value">{data.publicReviewClicks}</div>
                </div>
                <div className="widget-stat-box red-box">
                    <span className="stat-card__label label-red">Private Feedback</span>
                    <div className="stat-card__value value-red">{data.privateFeedback}</div>
                </div>
            </div>
        </div>
    );
}

export function ConversionMetricsWidget({ data }) {
    return (
        <div className="card">
            <h3 className="card__title widget-header">Conversion Rates</h3>
            <div className="widget-flex-col">
                <div className="widget-stat-box blue-box">
                    <span className="stat-card__label">Sent → Rated Conversion %</span>
                    <div className="stat-card__value">{data.sentRateConversion}%</div>
                </div>
                <div className="widget-stat-box blue-box">
                    <span className="stat-card__label">Rated → Public Clicks %</span>
                    <div className="stat-card__value">{data.clickConversion}%</div>
                </div>
            </div>
        </div>
    );
}

export function DriverPerformanceWidget({ data }) {
    return (
        <div className="card">
            <h3 className="card__title widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Driver Performance
                <Link href="/admin/drivers" className="text-xs text-green-600 font-bold hover:underline">Manage Drivers →</Link>
            </h3>
            <div className="widget-grid widget-grid-2">
                <div>
                    <h4 className="widget-subhead">Top Drivers</h4>
                    {data.topDrivers.length === 0 ? (
                        <p className="widget-empty">No top drivers yet.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table widget-table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th className="text-center">Rating</th>
                                        <th className="text-center">Trips</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topDrivers.map((d, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{d.name}</td>
                                            <td className="text-center"><span className="badge badge--green">★ {d.avgRating}</span></td>
                                            <td className="text-center text-gray">{d.ratedTrips}</td>
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
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table widget-table">
                                <thead>
                                    <tr>
                                        <th>Driver</th>
                                        <th className="text-center">Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.attentionDrivers.map((d, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{d.name}</td>
                                            <td className="text-center"><span className="badge badge--red">★ {d.avgRating}</span></td>
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
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table widget-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Type</th>
                                    <th className="text-center">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((v, i) => (
                                    <tr key={i}>
                                        <td className="font-medium">{v.type}</td>
                                        <td className="text-center"><span className="badge badge--blue">★ {v.avgRating}</span></td>
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
            <h3 className="card__title widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Action Required: Unresolved Feedback
                <Link href="/admin/feedback" className="text-xs text-red-600 font-bold hover:underline">Go to Feedback →</Link>
            </h3>
            <div className="widget-grid widget-grid-2">
                <div>
                    <div className="widget-subhead" style={{ marginBottom: '12px' }}>Unresolved Feedback Aging</div>
                    <div className="widget-flex-col">
                        <div className="aging-row gray-box">
                            <span className="font-medium">0–2 days</span>
                            <span className="badge">{data.days_0_2}</span>
                        </div>
                        <div className="aging-row gray-box">
                            <span className="font-medium">3–7 days</span>
                            <span className="badge badge--blue">{data.days_3_7}</span>
                        </div>
                        <div className="aging-row red-box alert-border">
                            <span className="font-medium label-red">8+ days</span>
                            <span className="badge badge--red">{data.days_8_plus}</span>
                        </div>
                    </div>
                </div>
                <div className="widget-actions">
                    <div className="widget-subhead" style={{ marginBottom: '16px' }}>Quick Actions</div>
                    <button className="btn btn--primary">Assign Feedback</button>
                    <button className="btn btn--outline">Mark as Resolved</button>
                    <Link href="/admin/feedback" className="btn btn--outline" style={{ textAlign: 'center' }}>Email Passenger</Link>
                </div>
            </div>
        </div>
    );
}
