import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const DEFAULTS = {
  ratingPage: {
    title: 'How was your experience?',
    subtitle: 'Your feedback helps us improve.',
    thankYouMessage: 'Thank you for your feedback!',
  },
};

export async function getSettings(key) {
  const doc = await mongoose.model('Settings').findOne({ key });
  return doc ? doc.value : (DEFAULTS[key] ?? null);
}

export async function setSettings(key, value) {
  await mongoose.model('Settings').findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true }
  );
  return value;
}

export default mongoose.model('Settings', settingsSchema);
