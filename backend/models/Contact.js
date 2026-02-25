import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  manifestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manifest', required: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  extra: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

contactSchema.index({ manifestId: 1 });

export default mongoose.model('Contact', contactSchema);
