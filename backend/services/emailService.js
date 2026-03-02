import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.gmail.user,
    pass: config.gmail.appPassword,
  },
});

export async function sendEmail(to, subject, html, text) {
  if (!config.gmail.user || !config.gmail.appPassword) {
    console.warn('Gmail SMTP not configured, skipping email to', to);
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${config.gmail.fromName}" <${config.gmail.fromEmail}>`,
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
