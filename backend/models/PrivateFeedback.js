import mongoose from 'mongoose';

const privateFeedbackSchema = new mongoose.Schema({
  reviewRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewRequest', required: true },
  content: { type: String, default: '' },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  comments: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('PrivateFeedback', privateFeedbackSchema);
