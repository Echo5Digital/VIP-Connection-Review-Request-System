import mongoose from 'mongoose';

const manifestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

export default mongoose.model('Manifest', manifestSchema);
