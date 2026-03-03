import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: config.smtp.port,
  secure: Number(config.smtp.port) === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendEmail(to, subject, html, text) {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('SMTP not configured, skipping email to', to);
    return { success: true };
  }

  try {
    const from =
      config.smtp.from ||
      `"${config.gmail.fromName}" <${config.gmail.fromEmail}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]+>/g, '') || '',
    });
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't swallow the error, let the caller handle it or at least know it failed
    throw error; 
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendReviewRequestEmail(clientEmail, token, passengerName = 'Valued Customer') {
  const safeName = escapeHtml(passengerName);
  const baseUrl = String(config.nextAppUrl || 'http://localhost:3000').replace(/\/$/, '');
  const reviewUrl = `${baseUrl}/r/${encodeURIComponent(token)}`;

  const subject = 'Rate Your VIP Connection Experience';
  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rate Your Experience</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px 28px;text-align:center;">
                <div style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:700;font-size:22px;line-height:1;padding:12px 18px;border-radius:10px;letter-spacing:0.3px;">
                  VIP Connection
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 10px 28px;text-align:center;">
                <h1 style="margin:0 0 10px 0;font-size:28px;line-height:1.25;color:#111827;">Rate Your Service</h1>
                <p style="margin:0;font-size:16px;line-height:1.6;color:#374151;">
                  Hi ${safeName}, thank you for riding with us. Your feedback helps us keep every trip exceptional.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 14px 28px;text-align:center;">
                <a href="${reviewUrl}" style="display:inline-block;background:#22c55e;color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;padding:16px 30px;border-radius:10px;">
                  Rate Your Experience
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 28px 24px 28px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:8px 0 0 0;font-size:13px;color:#15803d;word-break:break-all;">
                  <a href="${reviewUrl}" style="color:#15803d;text-decoration:underline;">${reviewUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                  VIP Connection
                </p>
                <p style="margin:2px 0 0 0;font-size:12px;color:#9ca3af;">
                  © ${new Date().getFullYear()} VIP Connection. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `VIP Connection\n\nHi ${passengerName}, thank you for riding with us.\nRate your experience here: ${reviewUrl}`;
  return sendEmail(clientEmail, subject, html, text);
}
