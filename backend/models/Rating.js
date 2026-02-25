import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  reviewRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewRequest', required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
  publicComment: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ratingSchema.index({ reviewRequestId: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
