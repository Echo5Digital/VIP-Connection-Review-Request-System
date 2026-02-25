import { Router } from 'express';
import RedirectEvent from '../models/RedirectEvent.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { redirectId, from, to } = req.query;
    const filter = {};
    if (redirectId) filter.redirectId = redirectId;
    if (from || to) {
      filter.hitAt = {};
      if (from) filter.hitAt.$gte = new Date(from);
      if (to) filter.hitAt.$lte = new Date(to);
    }
    const events = await RedirectEvent.find(filter)
      .sort({ hitAt: -1 })
      .populate('reviewRequestId')
      .limit(500);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/track', async (req, res, next) => {
  try {
    const { redirectId, reviewRequestId } = req.body;
    if (!redirectId) return res.status(400).json({ message: 'redirectId required' });
    const { recordRedirectHit } = await import('../services/redirectTracker.js');
    await recordRedirectHit(redirectId, reviewRequestId || null, req);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
