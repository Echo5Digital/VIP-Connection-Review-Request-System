import express from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import ReviewRequest from '../models/ReviewRequest.js';
import Rating from '../models/Rating.js';
import PublicReviewClick from '../models/PublicReviewClick.js';
import PrivateFeedback from '../models/PrivateFeedback.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles('admin'));

router.get('/analytics', async (req, res) => {
    try {
        // 1. Review Funnel Metrics
        const requestsSent = await ReviewRequest.countDocuments();
        const delivered = await ReviewRequest.countDocuments({ status: 'delivered' });
        const ratingsSubmitted = await Rating.countDocuments();

        // 5★ Driver & 5★ Vehicle Ratings
        const fiveStarDriverVehicle = await Rating.countDocuments({
            driverRating: 5,
            vehicleRating: 5
        });

        const publicReviewClicks = await PublicReviewClick.countDocuments();
        const privateFeedback = await PrivateFeedback.countDocuments();

        // 2. Conversion Rate Metrics
        const sentRateConversion = requestsSent > 0 ? Math.round((ratingsSubmitted / requestsSent) * 100) : 0;
        const clickConversion = ratingsSubmitted > 0 ? Math.round((publicReviewClicks / ratingsSubmitted) * 100) : 0;

        // 3. Driver Performance Widget
        const statsByContact = await Rating.aggregate([
            {
                $lookup: {
                    from: 'reviewrequests',
                    localField: 'reviewRequestId',
                    foreignField: '_id',
                    as: 'request'
                }
            },
            { $unwind: '$request' },
            {
                $lookup: {
                    from: 'contacts',
                    localField: 'request.contactId',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            { $unwind: '$contact' }
        ]);

        const driverStatsMap = {};
        const vehicleStatsMap = {};

        statsByContact.forEach(item => {
            // Find driver name
            let driverName = item.contact?.extra?.DispatchDriverName
                || item.contact?.extra?.['Dispatch Driver Name']
                || item.contact?.extra?.driver
                || item.contact?.extra?.Driver
                || 'Unknown';

            if (item.driverRating) {
                if (!driverStatsMap[driverName]) {
                    driverStatsMap[driverName] = { name: driverName, totalRating: 0, count: 0 };
                }
                driverStatsMap[driverName].totalRating += item.driverRating;
                driverStatsMap[driverName].count += 1;
            }

            // Find vehicle type
            let vehicleType = item.contact?.extra?.DispatchVehicleTypeCode
                || item.contact?.extra?.['Dispatch Vehicle Type Code']
                || item.contact?.extra?.vehicle
                || item.contact?.extra?.Vehicle
                || 'Unknown';

            if (item.vehicleRating) {
                if (!vehicleStatsMap[vehicleType]) {
                    vehicleStatsMap[vehicleType] = { type: vehicleType, totalRating: 0, count: 0 };
                }
                vehicleStatsMap[vehicleType].totalRating += item.vehicleRating;
                vehicleStatsMap[vehicleType].count += 1;
            }
        });

        const driverStats = Object.values(driverStatsMap).map(d => ({
            name: d.name,
            avgRating: Number((d.totalRating / d.count).toFixed(1)),
            ratedTrips: d.count
        })).sort((a, b) => b.avgRating - a.avgRating);

        const vehicleStats = Object.values(vehicleStatsMap).map(v => ({
            type: v.type,
            avgRating: Number((v.totalRating / v.count).toFixed(1)),
            ratedTrips: v.count
        })).sort((a, b) => b.avgRating - a.avgRating);

        const topDrivers = driverStats.filter(d => d.avgRating >= 4.5).slice(0, 5);
        const attentionDrivers = driverStats.filter(d => d.avgRating < 4.0).slice(0, 5);

        // 4. Negative Feedback Action Panel
        // Assume private feedabck is "unresolved" if no status exists, or we just show recent private feedback
        // Since there is no status, we just count them by days
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const allFeedback = await PrivateFeedback.find();

        let unresolved0_2 = 0;
        let unresolved3_7 = 0;
        let unresolved8Plus = 0;

        allFeedback.forEach(f => {
            const submittedAt = new Date(f.submittedAt || f.createdAt);
            if (submittedAt >= twoDaysAgo) {
                unresolved0_2++;
            } else if (submittedAt >= sevenDaysAgo) {
                unresolved3_7++;
            } else {
                unresolved8Plus++;
            }
        });

        res.json({
            funnel: {
                requestsSent,
                delivered,
                ratingsSubmitted,
                fiveStarDriverVehicle,
                publicReviewClicks,
                privateFeedback
            },
            conversion: {
                sentRateConversion,
                clickConversion,
            },
            drivers: {
                topDrivers,
                attentionDrivers
            },
            vehicles: vehicleStats.slice(0, 5),
            negativeFeedback: {
                total: allFeedback.length,
                days_0_2: unresolved0_2,
                days_3_7: unresolved3_7,
                days_8_plus: unresolved8Plus
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
