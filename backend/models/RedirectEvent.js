import mongoose from 'mongoose';

const redirectEventSchema = new mongoose.Schema({
  redirectId: { type: String, required: true },
  reviewRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewRequest' },
  hitAt: { type: Date, default: Date.now },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

redirectEventSchema.index({ redirectId: 1, hitAt: -1 });
redirectEventSchema.index({ reviewRequestId: 1 });

export default mongoose.model('RedirectEvent', redirectEventSchema);
