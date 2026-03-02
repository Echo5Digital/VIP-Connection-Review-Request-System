import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import { config } from './config/index.js';

import authRoutes from './routes/auth.js';
import manifestRoutes from './routes/manifests.js';
import ratingRoutes from './routes/rating.js';
import feedbackRoutes from './routes/feedback.js';
import redirectRoutes from './routes/redirects.js';
import settingsRoutes from './routes/settings.js';
import clientRoutes from './routes/client.js';
import driverRoutes from './routes/drivers.js';
import goRedirectRoute from './routes/go.js';
import reviewRequestsRoutes from './routes/review-requests.js';
import Admin from './models/Admin.js';
import Client from './models/Client.js';

await connectDb();

// Run migrations
try {
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.listCollections().toArray();
    const hasCustomers = collections.some((c) => c.name === 'customers');
    if (hasCustomers) {
      await db.collection('customers').rename('clients');
      console.log('Migrated customers collection to clients');
    }

    await db.collection('ratings').updateMany(
      { source: 'customer' },
      { $set: { source: 'client' }, $rename: { customerId: 'clientId' } }
    );
  }
} catch (err) {
  console.error('Migration error:', err);
}

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
const seedClientEmail = process.env.SEED_CLIENT_EMAIL?.toLowerCase().trim();
const seedClientPassword = process.env.SEED_CLIENT_PASSWORD;

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

if (seedClientEmail && seedClientPassword) {
  const existing = await Client.findOne({ email: seedClientEmail }).select('+password');
  if (!existing) {
    await Client.create({
      email: seedClientEmail,
      password: seedClientPassword,
      name: 'Test Client',
      active: true,
    });
    console.log('Seeded client:', seedClientEmail);
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
app.use('/api/clients', clientRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/review-requests', reviewRequestsRoutes);
app.get('/go/:redirectId', goRedirectRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(config.port, () => console.log(`API listening on ${config.port}`));
