import twilio from 'twilio';
import { config } from '../config/index.js';

let client = null;
if (config.twilio.accountSid && config.twilio.authToken) {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
}

export async function sendSms(to, body) {
  if (!client || !config.twilio.phoneNumber) {
    console.warn('Twilio not configured, skipping SMS to', to);
    return { sid: 'mock', success: true };
  }
  const result = await client.messages.create({
    body,
    from: config.twilio.phoneNumber,
    to: to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`,
  });
  return { sid: result.sid, success: true };
}
