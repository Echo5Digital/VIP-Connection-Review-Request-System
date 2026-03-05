import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporterCache = new Map();

function isGmailSmtp(host = '') {
  const value = String(host || '').toLowerCase();
  return value.includes('gmail');
}

function isLikelyGmailAppPassword(password = '') {
  const normalized = String(password).replace(/\s+/g, '');
  return /^[a-zA-Z0-9]{16}$/.test(normalized);
}

function resolveTransportConfig(options = {}) {
  const shouldUseMailtrap = Boolean(options.useMailtrap) || config.smtp.useMailtrap || String(config.smtp.provider).toLowerCase() === 'mailtrap';

  if (shouldUseMailtrap) {
    return {
      provider: 'mailtrap',
      host: config.mailtrap.host,
      port: config.mailtrap.port,
      secure: config.mailtrap.secure,
      user: config.mailtrap.user,
      pass: config.mailtrap.pass,
      fromName: config.mailtrap.fromName || config.smtp.fromName || 'VIP Connection',
      fromEmail: config.mailtrap.fromEmail || config.mailtrap.user,
    };
  }

  return {
    provider: 'smtp',
    host: config.smtp.host,
    port: config.smtp.port,
    secure: isGmailSmtp(config.smtp.host)
      ? Number(config.smtp.port) === 465
      : config.smtp.secure,
    user: config.smtp.user,
    pass: config.smtp.pass,
    fromName: config.smtp.fromName || 'VIP Connection',
    fromEmail: config.smtp.fromEmail || config.smtp.user,
  };
}

function getTransporter(transportConfig) {
  const cacheKey = `${transportConfig.provider}:${transportConfig.host}:${transportConfig.port}:${transportConfig.user}:${transportConfig.secure}`;
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey);
  }

  const transporter = nodemailer.createTransport({
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    logger: config.smtp.logger,
    debug: config.smtp.debug,
    auth: {
      user: transportConfig.user,
      pass: transportConfig.pass,
    },
  });

  transporterCache.set(cacheKey, transporter);
  return transporter;
}

function buildFromAddress(transportConfig, warnings) {
  const senderName = transportConfig.fromName || 'VIP Connection';
  const configuredFromEmail = String(config.smtp.fromEmail || '').trim();
  const authUser = String(transportConfig.user || '').trim();

  if (isGmailSmtp(transportConfig.host)) {
    if (Number(transportConfig.port) !== 465 && Number(transportConfig.port) !== 587) {
      warnings.push(`Gmail detected: recommended SMTP_PORT is 465 (secure:true) or 587 (secure:false). Current port is ${transportConfig.port}.`);
    }
    if (Number(transportConfig.port) === 465 && transportConfig.secure !== true) {
      warnings.push('Gmail detected: port 465 should use secure:true.');
    }
    if (Number(transportConfig.port) === 587 && transportConfig.secure !== false) {
      warnings.push('Gmail detected: port 587 should use secure:false.');
    }
    if (!isLikelyGmailAppPassword(transportConfig.pass)) {
      warnings.push('Gmail detected: SMTP_PASS does not look like a 16-character Gmail app password. Gmail may reject or silently drop this.');
    }
    if (!config.smtp.gmail2faEnabled) {
      warnings.push('Gmail detected: set GMAIL_2FA_ENABLED=true after enabling 2-Step Verification. App passwords require 2FA.');
    }
    if (configuredFromEmail && authUser && configuredFromEmail.toLowerCase() !== authUser.toLowerCase()) {
      warnings.push(`Gmail detected: SMTP_FROM_EMAIL (${configuredFromEmail}) mismatches SMTP_USER (${authUser}). Using SMTP_USER for "from" to improve deliverability.`);
    }
  }

  // Many providers accept a message for queueing but later drop it if "from" does not align
  // with the authenticated SMTP identity or authorized sending domain.
  const fromEmail = authUser || configuredFromEmail || transportConfig.fromEmail;
  return `"${senderName}" <${fromEmail}>`;
}

function normalizeSendResult(info, warnings = []) {
  const accepted = Array.isArray(info?.accepted) ? info.accepted : [];
  const rejected = Array.isArray(info?.rejected) ? info.rejected : [];
  const pending = Array.isArray(info?.pending) ? info.pending : [];
  const success = accepted.length > 0 && rejected.length === 0;

  return {
    success,
    messageId: info?.messageId || null,
    accepted,
    rejected,
    pending,
    response: info?.response || null,
    envelope: info?.envelope || null,
    warnings,
  };
}

export async function verifyEmailTransport(options = {}) {
  const transportConfig = resolveTransportConfig(options);
  const transporter = getTransporter(transportConfig);

  try {
    const verifyResponse = await transporter.verify();
    return {
      success: true,
      transport: {
        provider: transportConfig.provider,
        host: transportConfig.host,
        port: transportConfig.port,
        secure: transportConfig.secure,
        user: transportConfig.user,
      },
      verifyResponse,
    };
  } catch (error) {
    console.error('SMTP verify failed (full error object):', error);
    return {
      success: false,
      transport: {
        provider: transportConfig.provider,
        host: transportConfig.host,
        port: transportConfig.port,
        secure: transportConfig.secure,
        user: transportConfig.user,
      },
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
        command: error?.command,
        stack: error?.stack,
      },
    };
  }
}

export async function sendEmail(to, subject, html, text) {
  return sendEmailWithDiagnostics({ to, subject, html, text });
}

export async function sendEmailWithDiagnostics({
  to,
  subject,
  html,
  text,
  useMailtrap = false,
}) {
  const transportConfig = resolveTransportConfig({ useMailtrap });

  if (!transportConfig.user || !transportConfig.pass) {
    return {
      success: false,
      messageId: null,
      accepted: [],
      rejected: [],
      pending: [],
      response: null,
      envelope: null,
      warnings: [],
      error: {
        message: 'SMTP is not configured. Set SMTP_USER/SMTP_PASS (or MAILTRAP_USER/MAILTRAP_PASS when using Mailtrap).',
      },
    };
  }

  const warnings = [];
  const transporter = getTransporter(transportConfig);
  const from = buildFromAddress(transportConfig, warnings);

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]+>/g, '') || '',
    });

    // A "sent" response only confirms SMTP accepted the message for processing.
    // Mailbox providers can still quarantine/drop later due to reputation, SPF/DKIM/DMARC, or policy.
    console.log('SMTP sendMail info object (full):');
    console.dir(info, { depth: null });

    const result = normalizeSendResult(info, warnings);
    console.log('SMTP diagnostics:', {
      accepted: result.accepted,
      rejected: result.rejected,
      pending: result.pending,
      response: result.response,
      envelope: result.envelope,
    });

    if (!result.success) {
      const rejectedList = result.rejected.map((value) => String(value)).join(', ') || 'unknown recipient';
      result.error = {
        message: `SMTP accepted request but recipient delivery is not confirmed. Rejected recipients: ${rejectedList}`,
      };
    }

    return result;
  } catch (error) {
    // Silent dropping often starts as soft policy-level failures here (auth, envelope, sender alignment).
    // Logging the full error object makes SMTP response codes visible for debugging.
    console.error('SMTP send failed (full error object):', error);

    return {
      success: false,
      messageId: null,
      accepted: [],
      rejected: [],
      pending: [],
      response: error?.response || null,
      envelope: error?.envelope || null,
      warnings,
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
        command: error?.command,
        stack: error?.stack,
      },
    };
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

export async function sendReviewRequestEmail(clientEmail, token, passengerName = 'Valued Customer', resNumber = '', driverName = '') {
  const { getSettings } = await import('../models/Settings.js');
  const templates = await getSettings('templates') || {
    emailSubject: 'Your recent VIP Connection ride - quick feedback request',
    emailBody: 'Hi {PassengerName}, thank you for riding with us. Please share your feedback here: {ReviewLink}',
  };

  const safeName = escapeHtml(passengerName);
  const safeResNumber = escapeHtml(resNumber || '');
  const baseUrl = String(config.nextAppUrl || 'http://localhost:3000').replace(/\/$/, '');
  const reviewUrl = `${baseUrl}/r/${encodeURIComponent(token)}`;

  let subject = templates.emailSubject || 'Your recent VIP Connection ride - quick feedback request';
  let body = templates.emailBody || 'Hi {PassengerName}, thank you for riding with us. Please share your feedback here: {ReviewLink}';

  const replacements = {
    '{PassengerName}': passengerName,
    '{DriverName}': driverName || 'your driver',
    '{ReviewLink}': reviewUrl,
  };

  Object.entries(replacements).forEach(([key, val]) => {
    subject = subject.replaceAll(key, val);
    body = body.replaceAll(key, val);
  });

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
                <p style="margin:0;font-size:16px;line-height:1.6;color:#374151;white-space:pre-wrap;">${body.replace(reviewUrl, `<a href="${reviewUrl}" style="color:#22c55e;text-decoration:underline;">${reviewUrl}</a>`)}</p>
                ${resNumber ? `<p style="margin:10px 0 0 0;font-size:14px;line-height:1.5;color:#1f2937;font-weight:600;">Reservation Number: ${safeResNumber}</p>` : ''}
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
              <td style="padding:16px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">VIP Connection</p>
                <p style="margin:2px 0 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} VIP Connection. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = body.replace(/<[^>]+>/g, '');
  return sendEmailWithDiagnostics({ to: clientEmail, subject, html, text });
}
