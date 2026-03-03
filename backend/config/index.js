import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/review-request',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  expressUrl: process.env.EXPRESS_URL || 'http://localhost:4000',
  nextAppUrl: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true'
      ? true
      : Number(process.env.SMTP_PORT || 587) === 465,
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
    from: process.env.SMTP_FROM,
    fromName: process.env.SMTP_FROM_NAME || process.env.GMAIL_FROM_NAME || 'Review Request',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.GMAIL_FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  gmail: {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
    fromEmail: process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER,
    fromName: process.env.GMAIL_FROM_NAME || 'Review Request',
  },
};
