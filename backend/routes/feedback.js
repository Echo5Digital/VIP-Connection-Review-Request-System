import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import Rating from '../models/Rating.js';

const router = Router();
router.use(requireAuth, requireRoles('admin', 'client'));

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.filter || 'all';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if (filter === 'negative') {
      // Find ratings where driverRating < 5 OR vehicleRating < 5
      const negativeRatings = await Rating.find({
        $or: [{ driverRating: { $lt: 5 } }, { vehicleRating: { $lt: 5 } }],
        reviewRequestId: { $ne: null },
      }).select('reviewRequestId');

      const negativeRequestIds = negativeRatings.map((r) => r.reviewRequestId);

      const [list, total] = await Promise.all([
        PrivateFeedback.find({ reviewRequestId: { $in: negativeRequestIds } })
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({ path: 'reviewRequestId', populate: { path: 'contactId', select: 'name email phone' } }),
        PrivateFeedback.countDocuments({ reviewRequestId: { $in: negativeRequestIds } }),
      ]);

      // Attach rating info to each feedback item
      const ratingMap = {};
      negativeRatings.forEach((r) => {
        if (r.reviewRequestId) ratingMap[r.reviewRequestId.toString()] = r;
      });
      const enriched = await enrichWithRatings(list);

      return res.json({
        list: enriched,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // Default: all feedback
    const [list, total] = await Promise.all([
      PrivateFeedback.find()
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'reviewRequestId', populate: { path: 'contactId', select: 'name email phone' } }),
      PrivateFeedback.countDocuments(),
    ]);

    const enriched = await enrichWithRatings(list);
    res.json({
      list: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

async function enrichWithRatings(feedbackList) {
  const requestIds = feedbackList
    .map((f) => f.reviewRequestId?._id || f.reviewRequestId)
    .filter(Boolean);

  const ratings = await Rating.find({ reviewRequestId: { $in: requestIds } })
    .select('reviewRequestId driverRating vehicleRating');

  const ratingMap = {};
  ratings.forEach((r) => {
    if (r.reviewRequestId) ratingMap[r.reviewRequestId.toString()] = r;
  });

  return feedbackList.map((f) => {
    const reqId = (f.reviewRequestId?._id || f.reviewRequestId)?.toString();
    const rating = reqId ? ratingMap[reqId] : null;
    const obj = f.toObject ? f.toObject() : f;
    return {
      ...obj,
      driverRating: rating?.driverRating ?? null,
      vehicleRating: rating?.vehicleRating ?? null,
    };
  });
}

router.get('/:id', async (req, res, next) => {
  try {
    const feedback = await PrivateFeedback.findById(req.params.id)
      .populate({ path: 'reviewRequestId', populate: { path: 'contactId' } });
    if (!feedback) return res.status(404).json({ message: 'Not found' });
    res.json(feedback);
  } catch (err) {
    next(err);
  }
});

export default router;
