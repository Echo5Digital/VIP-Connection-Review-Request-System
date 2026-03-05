import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb } from './config/db.js';
import { config } from './config/index.js';

import authRoutes from './routes/auth.js';
import manifestRoutes from './routes/manifests.js';
import ratingRoutes from './routes/rating.js';
import feedbackRoutes from './routes/feedback.js';
import redirectRoutes from './routes/redirects.js';
import settingsRoutes from './routes/settings.js';
import driverRoutes from './routes/drivers.js';
import goRedirectRoute from './routes/go.js';
import reviewRequestsRoutes from './routes/review-requests.js';
import testEmailRoutes from './routes/test-email.js';
import dashboardRoutes from './routes/dashboard.js';
import affiliatesRoutes from './routes/affiliates.js';
import restrictionsRoutes from './routes/restrictions.js';
import usersRoutes from './routes/users.js';
import Admin from './models/Admin.js';

await connectDb();

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

if (seedAdminEmail && seedAdminPassword) {
  const existing = await Admin.findOne({ email: seedAdminEmail }).select('+password');
  if (!existing) {
    await Admin.create({
      email: seedAdminEmail,
      password: seedAdminPassword,
      name: 'Admin',
    });
    console.log('Seeded admin:', seedAdminEmail);
  }
}

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || config.nextAppUrl)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/manifests', manifestRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/redirects', redirectRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/review-requests', reviewRequestsRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/restrictions', restrictionsRoutes);
app.use('/api/users', usersRoutes);
app.get('/go/:redirectId', goRedirectRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(config.port, () => console.log(`API listening on ${config.port}`));
