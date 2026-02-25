import { Router } from 'express';
import PrivateFeedback from '../models/PrivateFeedback.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await PrivateFeedback.find()
      .sort({ submittedAt: -1 })
      .populate({ path: 'reviewRequestId', populate: { path: 'contactId', select: 'name email phone' } })
      .limit(100);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

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
