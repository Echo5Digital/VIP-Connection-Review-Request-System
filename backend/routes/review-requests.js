import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import Contact from '../models/Contact.js';
import ReviewRequest, { generateToken } from '../models/ReviewRequest.js';
import Rating from '../models/Rating.js';
import PrivateFeedback from '../models/PrivateFeedback.js';
import PublicReviewClick from '../models/PublicReviewClick.js';
import { sendEmail } from '../services/sendgridService.js';
import { sendSms } from '../services/twilioService.js';
import { config } from '../config/index.js';

const router = Router();

// POST /api/review-requests/send
// Generates a review request token and sends it via email or SMS
router.post(
  '/send',
  requireAuth,
  requireRoles('admin', 'client'),
  body('contactId').notEmpty().withMessage('contactId is required'),
  body('channel').isIn(['email', 'sms']).withMessage('channel must be email or sms'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { contactId, channel } = req.body;
      const contact = await Contact.findById(contactId).populate('manifestId', 'name');
      if (!contact) return res.status(404).json({ message: 'Contact not found' });

      if (channel === 'email' && !contact.email) {
        return res.status(400).json({ message: 'This contact does not have an email address.' });
      }
      if (channel === 'sms' && !contact.phone) {
        return res.status(400).json({ message: 'This contact does not have a phone number.' });
      }

      const token = generateToken();
      const reviewRequest = await ReviewRequest.create({
        contactId: contact._id,
        manifestId: contact.manifestId?._id || contact.manifestId,
        token,
        channel,
        status: 'sent',
      });

      const link = `${config.nextAppUrl}/r/${token}`;
      const passengerName = contact.name || 'Valued Customer';

      if (channel === 'email') {
        const subject = 'Rate Your VIP Connection Experience';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Thank You for Riding with VIP Connection</h2>
            <p>Dear ${passengerName},</p>
            <p>We hope you enjoyed your recent ride. We would love to hear about your experience!</p>
            <p>Please take a moment to rate your driver and vehicle:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: #1e40af; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;">
                Rate Our Service
              </a>
            </div>
            <p style="color: #64748b; font-size: 13px;">Or copy this link into your browser: ${link}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} VIP Connection Review System</p>
          </div>
        `;
        await sendEmail(contact.email, subject, html);
        return res.json({ success: true, channel: 'email', sentTo: contact.email });
      }

      if (channel === 'sms') {
        const body = `Hi ${passengerName}, thank you for riding with VIP Connection! Please take a moment to rate your experience: ${link}`;
        await sendSms(contact.phone, body);
        return res.json({ success: true, channel: 'sms', sentTo: contact.phone });
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
