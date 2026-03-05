import mongoose from 'mongoose';

const affiliateSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Affiliate', affiliateSchema);
