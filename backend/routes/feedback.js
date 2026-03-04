import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import Rating from '../models/Rating.js';

const router = Router();
router.use(requireAuth, requireRoles('admin', 'client'));

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.filter || 'all';
    const compact = req.query.compact === '1' || req.query.compact === 'true';
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

      const query = PrivateFeedback.find({ reviewRequestId: { $in: negativeRequestIds } })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      if (compact) {
        query.select('reviewRequestId submittedAt');
      } else {
        query.populate({ path: 'reviewRequestId', populate: { path: 'contactId', select: 'name email phone' } });
      }

      const [list, total] = await Promise.all([
        query,
        PrivateFeedback.countDocuments({ reviewRequestId: { $in: negativeRequestIds } }),
      ]);

      const enriched = await enrichWithRatings(list, { compact });

      return res.json({
        list: enriched,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // Default: all feedback
    const query = PrivateFeedback.find()
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    if (compact) {
      query.select('reviewRequestId submittedAt');
    } else {
      query.populate({ path: 'reviewRequestId', populate: { path: 'contactId', select: 'name email phone' } });
    }

    const [list, total] = await Promise.all([query, PrivateFeedback.countDocuments()]);
    const enriched = await enrichWithRatings(list, { compact });
    res.json({
      list: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

async function enrichWithRatings(feedbackList, options = {}) {
  const { compact = false } = options;
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
    const base = compact
      ? {
        _id: f._id,
        reviewRequestId: f.reviewRequestId?._id || f.reviewRequestId || null,
        submittedAt: f.submittedAt,
      }
      : (f.toObject ? f.toObject() : f);

    return {
      ...base,
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
