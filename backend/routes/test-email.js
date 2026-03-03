import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { sendEmailWithDiagnostics, verifyEmailTransport } from '../services/emailService.js';

const router = Router();

// POST /api/test-email
// Why "sent" can still fail: SMTP server acceptance means "queued", not inbox placement.
// Final delivery can still be blocked later by mailbox provider policies or sender reputation checks.
router.post(
  '/',
  requireAuth,
  requireRoles('admin'),
  body('to').isEmail().withMessage('A valid "to" email is required'),
  body('useMailtrap').optional().isBoolean().withMessage('useMailtrap must be true or false'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const to = String(req.body.to).trim();
      const useMailtrap = Boolean(req.body.useMailtrap);
      const subject = 'VIP Connection service check - delivery diagnostics';
      const text = [
        'VIP Connection diagnostics email.',
        'This message verifies SMTP acceptance and exposes delivery debugging details.',
        'If this does not arrive, check accepted/rejected/response and provider logs.',
      ].join('\n');
      const html = `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
          <h2 style="margin:0 0 12px 0;">VIP Connection Diagnostics</h2>
          <p style="margin:0 0 8px 0;">This is a transactional test email for delivery troubleshooting.</p>
          <p style="margin:0 0 8px 0;">If this does not arrive, review SMTP diagnostics in the API response and server logs.</p>
        </div>
      `;

      const verify = await verifyEmailTransport({ useMailtrap });
      const result = await sendEmailWithDiagnostics({ to, subject, html, text, useMailtrap });

      // How to verify true delivery:
      // 1) accepted[] should include recipient
      // 2) rejected[] and pending[] should be empty
      // 3) response/envelope should match expected recipient
      // 4) mailbox/provider logs should confirm final placement (inbox/spam/rejected)
      return res.status(result.success ? 200 : 502).json({
        success: result.success,
        verify,
        smtp: {
          accepted: result.accepted,
          rejected: result.rejected,
          pending: result.pending,
          response: result.response,
          envelope: result.envelope,
          messageId: result.messageId,
          warnings: result.warnings,
        },
        error: result.error || null,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
