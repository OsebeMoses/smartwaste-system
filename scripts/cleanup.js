/*
  Database cleanup script for SmartWaste
  - Preserves admin users and SystemConfig
  - Purges PickupRequest and Redemption collections
  - Optionally trims non-admin users
  Usage: npm run db:cleanup
*/

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const Redemption = require('../models/Redemption');
const Reward = require('../models/Reward');
const SystemConfig = require('../models/SystemConfig');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartwaste';
  await mongoose.connect(uri, { dbName: undefined });

  try {
    console.log('Connected to MongoDB');

    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.warn('No admin users found. Aborting cleanup to avoid locking out the system.');
      process.exit(1);
    }

    // Delete non-admin users
    const delUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted non-admin users: ${delUsers.deletedCount}`);

    // Delete pickup requests
    const delPickups = await PickupRequest.deleteMany({});
    console.log(`Deleted pickup requests: ${delPickups.deletedCount}`);

    // Delete redemptions
    const delRedemptions = await Redemption.deleteMany({});
    console.log(`Deleted redemptions: ${delRedemptions.deletedCount}`);

    // Optionally reset rewards to active stock only if negative/invalid
    const rewardsUpdated = await Reward.updateMany(
      { stock: { $lt: 0 } },
      { $set: { stock: 0, status: 'inactive' } }
    );
    if (rewardsUpdated.modifiedCount) {
      console.log(`Sanitized rewards with invalid stock: ${rewardsUpdated.modifiedCount}`);
    }

    // Preserve SystemConfig (ensure one exists)
    await SystemConfig.getConfig();
    console.log('SystemConfig preserved/ensured.');

    // Rebuild indexes
    await Promise.all([
      User.syncIndexes(),
      PickupRequest.syncIndexes(),
      Redemption.syncIndexes(),
      Reward.syncIndexes(),
      SystemConfig.syncIndexes(),
    ]);
    console.log('Indexes synchronized.');

    console.log('Cleanup completed successfully.');
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
