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

const defaultAdminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin1234';
const defaultClientEmail = (process.env.SEED_CLIENT_EMAIL || 'testclient@gmail.com').toLowerCase();
const defaultClientPassword = process.env.SEED_CLIENT_PASSWORD || 'test1234';

if (defaultAdminEmail && defaultAdminPassword) {
  const existing = await Admin.findOne({ email: defaultAdminEmail }).select('+password');
  if (!existing) {
    await Admin.create({
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      name: 'Admin',
    });
    console.log('Seeded admin:', defaultAdminEmail);
  } else if (!(await existing.comparePassword(defaultAdminPassword))) {
    existing.password = defaultAdminPassword;
    await existing.save();
    console.log('Updated seeded admin password for:', defaultAdminEmail);
  }
}

if (defaultClientEmail && defaultClientPassword) {
  const existing = await Client.findOne({ email: defaultClientEmail }).select('+password');
  if (!existing) {
    await Client.create({
      email: defaultClientEmail,
      password: defaultClientPassword,
      name: 'Test Client',
      active: true,
    });
    console.log('Seeded client:', defaultClientEmail);
  } else if (!(await existing.comparePassword(defaultClientPassword))) {
    existing.password = defaultClientPassword;
    await existing.save();
    console.log('Updated seeded client password for:', defaultClientEmail);
  }
}

const app = express();
app.use(cors({ origin: config.nextAppUrl, credentials: true }));
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
