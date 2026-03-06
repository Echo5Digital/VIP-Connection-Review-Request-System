import mongoose from 'mongoose';

const restrictionSchema = new mongoose.Schema({
    customerCode: { type: String, default: '' },
    passengerName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    reason: { type: String, default: '' },
    source: { type: String, enum: ['Manual', 'Manifest Auto-Detection'], default: 'Manual' },
}, { timestamps: true });

export default mongoose.model('Restriction', restrictionSchema);
