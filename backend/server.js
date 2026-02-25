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
import Customer from './models/Customer.js';

await connectDb();

const defaultAdminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin1234';
const defaultCustomerEmail = (process.env.SEED_CUSTOMER_EMAIL || 'testcustomer@gmail.com').toLowerCase();
const defaultCustomerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'test1234';

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

if (defaultCustomerEmail && defaultCustomerPassword) {
  const existing = await Customer.findOne({ email: defaultCustomerEmail }).select('+password');
  if (!existing) {
    await Customer.create({
      email: defaultCustomerEmail,
      password: defaultCustomerPassword,
      name: 'Test Customer',
    });
    console.log('Seeded customer:', defaultCustomerEmail);
  } else if (!(await existing.comparePassword(defaultCustomerPassword))) {
    existing.password = defaultCustomerPassword;
    await existing.save();
    console.log('Updated seeded customer password for:', defaultCustomerEmail);
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
