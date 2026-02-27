import mongoose from 'mongoose';

const manifestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  columns: { type: [String], default: [] },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

export default mongoose.model('Manifest', manifestSchema);
