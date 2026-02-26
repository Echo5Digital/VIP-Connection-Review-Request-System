import Link from 'next/link';

export default function ClientDashboardPage() {
    return (
        <div className="dash-container">
            <div className="dash-header">
                <h1 className="text-headline">Client Dashboard</h1>
                <p className="text-subhead">Welcome to the VIP Connection Client Portal. Manage your experience and submit reviews.</p>
            </div>

            <div className="dash-grid">
                <Link href="/client/review" className="dash-card">
                    <div className="dash-card__header">
                        <div className="dash-card__icon-wrap">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <h2 className="dash-card__title">Submit Review</h2>
                    </div>
                    <div className="dash-card__body">
                        <p className="text-body">Rate your latest VIP Connection experience and share any feedback with us.</p>
                    </div>
                    <div className="dash-card__footer">
                        Start Review
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>
            </div>
        </div>
    );
}
