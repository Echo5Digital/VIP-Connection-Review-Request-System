import mongoose from 'mongoose';
import crypto from 'crypto';

const reviewRequestSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  manifestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest', required: true },
  token: { type: String, required: true, unique: true },
  channel: { type: String, enum: ['sms', 'email'], required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
  redirectId: { type: String, default: null },
}, { timestamps: true });

reviewRequestSchema.index({ token: 1 });
reviewRequestSchema.index({ manifestId: 1, sentAt: -1 });

export function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

export default mongoose.model('ReviewRequest', reviewRequestSchema);
