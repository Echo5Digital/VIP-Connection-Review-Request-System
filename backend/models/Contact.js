import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  manifestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest', required: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  pickupDate: { type: Date },
  pickupTime: { type: String, default: '' },
  pickupAddress: { type: String, default: '' },
  dropoffAddress: { type: String, default: '' },
  status: { type: String, default: 'Pending' },
  extra: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

contactSchema.index({ manifestId: 1 });
contactSchema.index({ pickupDate: 1 });

export default mongoose.model('Contact', contactSchema);
