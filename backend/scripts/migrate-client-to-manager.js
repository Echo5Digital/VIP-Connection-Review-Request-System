/**
 * One-time migration script:
 * 1. Updates any legacy `role: 'client'` users to `role: 'manager'`
 * 2. Renames the MongoDB collection from 'clients' to 'staff'
 *
 * Run BEFORE changing the collection name in models/Staff.js:
 *   node --experimental-vm-modules backend/scripts/migrate-client-to-manager.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/review-request';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Step 1: Migrate any legacy 'client' role users to 'manager'
  const result = await db.collection('clients').updateMany(
    { role: 'client' },
    { $set: { role: 'manager' } }
  );
  console.log(`Migrated ${result.modifiedCount} user(s) from role 'client' to 'manager'`);

  // Step 2: Rename the collection from 'clients' to 'staff'
  const collections = await db.listCollections({ name: 'clients' }).toArray();
  if (collections.length > 0) {
    await db.collection('clients').rename('staff');
    console.log("Renamed collection 'clients' → 'staff'");
  } else {
    console.log("Collection 'clients' not found — skipping rename");
  }

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
