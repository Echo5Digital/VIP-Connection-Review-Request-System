'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { EmojiRatingGroup } from '@/components/EmojiRatingGroup';

export default function ClientReviewPage() {
    const [driverRating, setDriverRating] = useState(0);
    const [vehicleRating, setVehicleRating] = useState(0);
    const [publicComment, setPublicComment] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (driverRating < 1 || vehicleRating < 1) {
            setError('Please provide both driver and vehicle ratings.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            await api.post('/api/rating/client-submit', {
                driverRating,
                vehicleRating,
                publicComment: publicComment.trim() || undefined,
            });
            setSuccess(true);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to submit rating');
        } finally {
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="dash-container">
                <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center' }}>
                    <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
                        <h1 className="text-headline" style={{ color: 'var(--blue-600)', marginBottom: '16px' }}>Thank You!</h1>
                        <p className="text-subhead">Your feedback has been submitted successfully. We appreciate your time!</p>
                        <button
                            type="button"
                            className="btn btn--primary mt-4"
                            onClick={() => {
                                setSuccess(false);
                                setDriverRating(0);
                                setVehicleRating(0);
                                setPublicComment('');
                            }}
                        >
                            Submit Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-container">
            <div className="dash-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className="text-headline">Client Rating</h1>
                <p className="text-subhead">We value your feedback. Rate your latest VIP Connection experience.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: '600px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
                    <div className="card__body" style={{ padding: '32px' }}>
                        <form onSubmit={handleSubmit}>
                            <EmojiRatingGroup
                                title="Driver Rating"
                                selected={driverRating}
                                onChange={setDriverRating}
                            />

                            <EmojiRatingGroup
                                title="Vehicle Rating"
                                selected={vehicleRating}
                                onChange={setVehicleRating}
                            />

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Comments:</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    maxLength={1000}
                                    value={publicComment}
                                    onChange={(event) => setPublicComment(event.target.value)}
                                    placeholder="Share any additional feedback..."
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            {error && <p className="form-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    type="submit"
                                    className="btn btn--success"
                                    style={{ padding: '12px 32px', fontSize: '16px' }}
                                    disabled={submitting || driverRating < 1 || vehicleRating < 1}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Rating'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
