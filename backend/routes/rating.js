import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import ReviewRequest from '../models/ReviewRequest.js';
import Rating from '../models/Rating.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import { getSettings } from '../models/Settings.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

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
  body('token').trim().notEmpty().withMessage('Token is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('publicComment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Public comment cannot exceed 1000 characters'),
  body('privateFeedback')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Private feedback cannot exceed 1000 characters'),
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
        source: 'request',
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

router.post(
  '/client-submit',
  requireAuth,
  requireRoles('client'),
  body('driverRating').isInt({ min: 1, max: 5 }).withMessage('Driver rating must be between 1 and 5'),
  body('vehicleRating').isInt({ min: 1, max: 5 }).withMessage('Vehicle rating must be between 1 and 5'),
  body('publicComment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const existing = await Rating.findOne({ clientId: req.user._id, source: 'client' });
      if (existing) {
        return res.status(400).json({ message: 'You have already submitted your rating' });
      }

      const driverRating = Number(req.body.driverRating);
      const vehicleRating = Number(req.body.vehicleRating);
      const averageRating = Number(((driverRating + vehicleRating) / 2).toFixed(1));

      await Rating.create({
        clientId: req.user._id,
        source: 'client',
        value: averageRating,
        driverRating,
        vehicleRating,
        publicComment: req.body.publicComment?.trim() || '',
      });

      res.status(201).json({ message: 'Rating submitted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
