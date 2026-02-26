import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clientSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, maxlength: 120, select: false },
    name: { type: String, default: '' },
    active: { type: Boolean, default: true },
}, { timestamps: true });

clientSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

clientSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('Client', clientSchema);
