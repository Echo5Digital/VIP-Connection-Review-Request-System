import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb } from './config/db.js';
import { config } from './config/index.js';

import authRoutes from './routes/auth.js';
import manifestRoutes from './routes/manifests.js';
import reviewRequestRoutes from './routes/review-requests.js';
import ratingRoutes from './routes/rating.js';
import feedbackRoutes from './routes/feedback.js';
import redirectRoutes from './routes/redirects.js';
import settingsRoutes from './routes/settings.js';
import goRedirectRoute from './routes/go.js';
import Admin from './models/Admin.js';

await connectDb();

if (process.env.SEED_ADMIN_EMAIL) {
  const existing = await Admin.countDocuments();
  if (existing === 0) {
    await Admin.create({
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
      name: 'Admin',
    });
    console.log('Seeded admin:', process.env.SEED_ADMIN_EMAIL);
  }
}

const app = express();
app.use(cors({ origin: config.nextAppUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/manifests', manifestRoutes);
app.use('/api/review-requests', reviewRequestRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/redirects', redirectRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/go/:redirectId', goRedirectRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(config.port, () => console.log(`API listening on ${config.port}`));
