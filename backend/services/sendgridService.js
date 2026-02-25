import sgMail from '@sendgrid/mail';
import { config } from '../config/index.js';

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

export async function sendEmail(to, subject, html, text) {
  if (!config.sendgrid.apiKey) {
    console.warn('SendGrid not configured, skipping email to', to);
    return { success: true };
  }
  await sgMail.send({
    to,
    from: { email: config.sendgrid.fromEmail, name: config.sendgrid.fromName },
    subject,
    html: html || text,
    text: text || html?.replace(/<[^>]+>/g, '') || '',
  });
  return { success: true };
}
