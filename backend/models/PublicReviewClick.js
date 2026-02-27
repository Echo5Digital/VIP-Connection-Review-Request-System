import mongoose from 'mongoose';

const publicReviewClickSchema = new mongoose.Schema({
  reviewRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewRequest', required: true },
  platform: { type: String, enum: ['google', 'yelp', 'tripadvisor'], required: true },
  clickedAt: { type: Date, default: Date.now },
}, { timestamps: true });

publicReviewClickSchema.index({ reviewRequestId: 1 });

export default mongoose.model('PublicReviewClick', publicReviewClickSchema);
