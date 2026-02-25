import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  reviewRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewRequest', default: null },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  source: { type: String, enum: ['request', 'customer'], required: true, default: 'request' },
  value: { type: Number, min: 1, max: 5 },
  driverRating: { type: Number, min: 1, max: 5 },
  vehicleRating: { type: Number, min: 1, max: 5 },
  publicComment: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ratingSchema.index(
  { reviewRequestId: 1 },
  { unique: true, partialFilterExpression: { reviewRequestId: { $type: 'objectId' } } }
);

export default mongoose.model('Rating', ratingSchema);
