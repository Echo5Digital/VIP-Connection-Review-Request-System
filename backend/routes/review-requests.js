import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Contact from '../models/Contact.js';
import ReviewRequest, { generateToken } from '../models/ReviewRequest.js';
import Rating from '../models/Rating.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import PublicReviewClick from '../models/PublicReviewClick.js';
import { sendReviewRequestEmail } from '../services/emailService.js';
import { sendSms } from '../services/twilioService.js';
import { config } from '../config/index.js';

const router = Router();

// POST /api/review-requests/send
// Generates a review request token and sends it via email or SMS
router.post(
  '/send',
  requireAuth,
  requireRoles('admin'),
  body('contactId').notEmpty().withMessage('contactId is required'),
  body('channel').isIn(['email', 'sms']).withMessage('channel must be email or sms'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { contactId, channel } = req.body;

      if (channel === 'sms') {
        return res.status(503).json({ message: 'SMS service is currently disabled.' });
      }

      const contact = await Contact.findById(contactId).populate('manifestId', 'name');
      if (!contact) return res.status(404).json({ message: 'Contact not found' });

      // Email requests must use the manifest PassengerEmailAddress value.
      const targetEmail = String(
        contact.extra?.PassengerEmailAddress ||
        contact.extra?.['Passenger Email Address'] ||
        ''
      ).trim();
      const targetPhone = contact.extra?.PassengerCellPhoneNumber || contact.extra?.PassngerCellPhoneNumber || contact.phone;

      if (channel === 'email' && !targetEmail) {
        return res.status(400).json({ message: 'PassengerEmailAddress is required to send review email.' });
      }
      if (channel === 'sms' && !targetPhone) {
        return res.status(400).json({ message: 'This contact does not have a phone number.' });
      }

      const token = generateToken();
      const passengerName = contact.extra?.PassengerFirstName || contact.name || 'Valued Customer';
      const resNumber = String(
        contact.extra?.ResNumber ||
        contact.extra?.['Res Number'] ||
        contact.extra?.['RES_NUMBER'] ||
        contact.extra?.resNumber ||
        ''
      ).trim();

      const reviewRequest = await ReviewRequest.create({
        contactId: contact._id,
        manifestId: contact.manifestId?._id || contact.manifestId,
        token,
        channel,
        status: 'failed',
        resNumber,
      });

      const link = `${config.nextAppUrl}/r/${token}`;

      if (channel === 'email') {
        const emailResult = await sendReviewRequestEmail(targetEmail, token, passengerName, resNumber);
        if (emailResult.success) {
          reviewRequest.status = 'sent';
          reviewRequest.sentAt = new Date();
        } else {
          reviewRequest.status = 'failed';
        }
        await reviewRequest.save();
        return res.status(emailResult.success ? 200 : 502).json({
          success: emailResult.success,
          channel: 'email',
          sentTo: targetEmail,
          messageId: emailResult?.messageId || null,
          accepted: emailResult?.accepted || [],
          rejected: emailResult?.rejected || [],
          pending: emailResult?.pending || [],
          response: emailResult?.response || null,
          envelope: emailResult?.envelope || null,
          warnings: emailResult?.warnings || [],
          error: emailResult?.error || null,
        });
      }

      if (channel === 'sms') {
        const body = `Hi ${passengerName}, thank you for riding with VIP Connection! Please take a moment to rate your experience: ${link}`;
        await sendSms(targetPhone, body);
        reviewRequest.status = 'sent';
        reviewRequest.sentAt = new Date();
        await reviewRequest.save();
        return res.json({ success: true, channel: 'sms', sentTo: targetPhone });
      }
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/review-requests/track-public-click
// Tracks when a customer clicks a platform review button (Google, Yelp, TripAdvisor)
router.post(
  '/track-public-click',
  body('token').notEmpty().withMessage('token is required'),
  body('platform').isIn(['google', 'yelp', 'tripadvisor']).withMessage('Invalid platform'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { token, platform } = req.body;
      const reviewRequest = await ReviewRequest.findOne({ token });
      if (!reviewRequest) return res.status(404).json({ message: 'Invalid token' });

      await PublicReviewClick.create({
        reviewRequestId: reviewRequest._id,
        platform,
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/review-requests/private-feedback
// Stores extended private feedback (name, email, comments) after a < 5 star rating
router.post(
  '/private-feedback',
  body('token').notEmpty().withMessage('token is required'),
  body('comments').optional().isString().trim().isLength({ max: 2000 }),
  body('name').optional().isString().trim().isLength({ max: 200 }),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { token, name, email, comments } = req.body;
      const reviewRequest = await ReviewRequest.findOne({ token });
      if (!reviewRequest) return res.status(404).json({ message: 'Invalid token' });

      // Verify a rating was submitted for this request
      const rating = await Rating.findOne({ reviewRequestId: reviewRequest._id });
      if (!rating) return res.status(400).json({ message: 'Rating not found for this token' });

      // Upsert: update existing private feedback or create a new one
      await PrivateFeedback.findOneAndUpdate(
        { reviewRequestId: reviewRequest._id },
        {
          reviewRequestId: reviewRequest._id,
          name: name || '',
          email: email || '',
          comments: comments || '',
          content: comments || '',
        },
        { upsert: true, new: true }
      );

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
