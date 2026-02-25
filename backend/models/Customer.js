import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const customerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, maxlength: 120, select: false },
  name: { type: String, default: '' },
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

customerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('Customer', customerSchema);
