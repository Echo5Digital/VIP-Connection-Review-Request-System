import mongoose from 'mongoose';

const manifestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  columns: { type: [String], default: [] },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'uploadedByModel' },
  uploadedByModel: { type: String, enum: ['Admin', 'Staff'] },
}, { timestamps: true });

export default mongoose.model('Manifest', manifestSchema);
