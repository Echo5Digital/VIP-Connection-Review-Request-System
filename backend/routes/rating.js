import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import ReviewRequest from '../models/ReviewRequest.js';
import Rating from '../models/Rating.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import { getSettings } from '../models/Settings.js';

const router = Router();

router.get('/page/:token', async (req, res, next) => {
  try {
    const request = await ReviewRequest.findOne({ token: req.params.token })
      .populate('contactId', 'name');
    if (!request) return res.status(404).json({ message: 'Invalid or expired link' });
    const existing = await Rating.findOne({ reviewRequestId: request._id });
    if (existing) {
      return res.json({ alreadySubmitted: true, rating: existing.value });
    }
    const settings = await getSettings('ratingPage') || {};
    res.json({
      alreadySubmitted: false,
      title: settings.title || 'How was your experience?',
      subtitle: settings.subtitle || 'Your feedback helps us improve.',
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/submit',
  body('token').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('publicComment').optional().isString(),
  body('privateFeedback').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { token, rating, publicComment, privateFeedback } = req.body;
      const request = await ReviewRequest.findOne({ token });
      if (!request) return res.status(404).json({ message: 'Invalid or expired link' });
      const existing = await Rating.findOne({ reviewRequestId: request._id });
      if (existing) return res.status(400).json({ message: 'Already submitted' });

      await Rating.create({
        reviewRequestId: request._id,
        value: Number(rating),
        publicComment: publicComment || '',
      });
      if (privateFeedback && String(privateFeedback).trim()) {
        await PrivateFeedback.create({
          reviewRequestId: request._id,
          content: String(privateFeedback).trim(),
        });
      }
      const settings = await getSettings('ratingPage') || {};
      res.json({ thankYouMessage: settings.thankYouMessage || 'Thank you for your feedback!' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
