import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import Rating from '../models/Rating.js';

const router = Router();
router.use(requireAuth, requireRoles('admin', 'manager'));

router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.filter || 'all';
    const compact = req.query.compact === '1' || req.query.compact === 'true';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if (filter === 'negative') {
      const negativeFilter = {
        $or: [{ driverRating: { $lt: 5 } }, { vehicleRating: { $lt: 5 } }],
        reviewRequestId: { $ne: null },
        source: 'request',
      };

      const [negativeRatings, total] = await Promise.all([
        Rating.find(negativeFilter)
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'reviewRequestId',
            populate: { path: 'contactId', select: 'name email phone extra' },
          }),
        Rating.countDocuments(negativeFilter),
      ]);

      // Optionally join PrivateFeedback — customer may not have submitted the form
      const requestIds = negativeRatings.map((r) => r.reviewRequestId?._id).filter(Boolean);
      const feedbackMap = {};
      if (requestIds.length) {
        const feedbackDocs = await PrivateFeedback.find({ reviewRequestId: { $in: requestIds } })
          .select('reviewRequestId comments content submittedAt');
        feedbackDocs.forEach((fb) => {
          feedbackMap[fb.reviewRequestId.toString()] = fb;
        });
      }

      const list = negativeRatings.map((r) => {
        const rObj = r.toObject ? r.toObject() : r;
        const reviewRequest = rObj.reviewRequestId;
        const contact = reviewRequest?.contactId;
        const extra = contact?.extra || {};
        const reqId = reviewRequest?._id?.toString();
        const fb = reqId ? feedbackMap[reqId] : null;

        return {
          _id: rObj._id,
          reviewRequestId: reviewRequest || null,
          driverRating: rObj.driverRating ?? null,
          vehicleRating: rObj.vehicleRating ?? null,
          submittedAt: rObj.submittedAt,
          resNumber: reviewRequest?.resNumber || extra?.ResNumber || extra?.['Res Number'] || '',
          dispatchDriverName: extra?.DispatchDriverName || extra?.['Dispatch Driver Name'] || '',
          dispatchVehicleTypeCode: extra?.DispatchVehicleTypeCode || extra?.['Dispatch Vehicle Type Code'] || '',
          fullComment: fb?.comments || fb?.content || rObj.publicComment || '',
        };
      });

      return res.json({
        list,
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
      query.populate({ path: 'reviewRequestId', populate: { path: 'contactId', select: 'name email phone extra' } });
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
    .select('reviewRequestId driverRating vehicleRating publicComment');

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

    const contact = base.reviewRequestId?.contactId;
    const contactExtra = contact?.extra || {};

    return {
      ...base,
      driverRating: rating?.driverRating ?? null,
      vehicleRating: rating?.vehicleRating ?? null,
      resNumber: base.reviewRequestId?.resNumber || contactExtra?.ResNumber || contactExtra?.['Res Number'] || '',
      dispatchDriverName: contactExtra?.DispatchDriverName || contactExtra?.['Dispatch Driver Name'] || '',
      dispatchVehicleTypeCode: contactExtra?.DispatchVehicleTypeCode || contactExtra?.['Dispatch Vehicle Type Code'] || '',
      fullComment: base.comments || base.content || rating?.publicComment || '',
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
