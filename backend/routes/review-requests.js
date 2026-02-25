import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Contact from '../models/Contact.js';
import ReviewRequest, { generateToken } from '../models/ReviewRequest.js';
import { sendSms } from '../services/twilioService.js';
import { sendEmail } from '../services/sendgridService.js';
import { config } from '../config/index.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await ReviewRequest.find()
      .sort({ sentAt: -1 })
      .populate('contactId', 'name phone email')
      .populate('manifestId', 'name')
      .limit(200);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/send',
  body('manifestId').isMongoId(),
  body('channel').isIn(['sms', 'email']),
  body('trackRedirects').optional().isBoolean(),
  body('message').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { manifestId, channel, trackRedirects, message } = req.body;
      const baseUrl = config.nextAppUrl.replace(/\/$/, '');
      const contacts = await Contact.find({ manifestId });
      if (!contacts.length) return res.status(400).json({ message: 'No contacts in manifest' });

      const defaultMessage = message || 'We\'d love your feedback! Please rate your experience.';
      const results = { sent: 0, failed: 0 };

      for (const contact of contacts) {
        const token = generateToken();
        const ratingUrl = `${baseUrl}/r/${token}`;
        const redirectId = trackRedirects ? `r-${token}` : null;
        const linkUrl = redirectId ? `${config.expressUrl}/go/${redirectId}?t=${token}` : ratingUrl;

        const reviewRequest = await ReviewRequest.create({
          contactId: contact._id,
          manifestId,
          token,
          channel,
          redirectId,
        });

        const smsBody = `${defaultMessage} ${linkUrl}`;
        const emailHtml = `<p>${defaultMessage.replace(/\n/g, '<br>')}</p><p><a href="${linkUrl}">Rate your experience</a></p>`;

        try {
          if (channel === 'sms' && contact.phone) {
            await sendSms(contact.phone, smsBody);
          } else if (channel === 'email' && contact.email) {
            await sendEmail(contact.email, 'We\'d love your feedback', emailHtml, smsBody);
          } else {
            results.failed++;
            continue;
          }
          results.sent++;
        } catch (e) {
          results.failed++;
          reviewRequest.status = 'failed';
          await reviewRequest.save();
        }
      }

      res.json({ ok: true, results });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
