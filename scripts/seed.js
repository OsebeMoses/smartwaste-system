const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config();

// DB connection helper
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Reward = require('../models/Reward');
const PickupRequest = require('../models/PickupRequest');
const SystemConfig = require('../models/SystemConfig');

async function hashPassword(plain) {
	const salt = await bcrypt.genSalt(12);
	return bcrypt.hash(plain, salt);
}

async function upsertUsers() {
	// Define users
	const rawUsers = [
		{
			name: 'Admin User',
			email: 'admin@smartwaste.local',
			phone: '+254700000001',
			password: 'Admin@123',
			role: 'admin',
			adminData: { permissions: { userManagement: true, systemConfig: true, analytics: true, reports: true } }
		},
		{
			name: 'Jane Resident',
			email: 'jane.resident@smartwaste.local',
			phone: '+254700000002',
			password: 'Resident@123',
			role: 'resident',
			residentData: {
				location: { address: 'Kilimani, Nairobi', coordinates: { lat: -1.2921, lng: 36.8219 } },
				wasteRecycled: 12,
				totalPickups: 5
			}
		},
		{
			name: 'John Resident',
			email: 'john.resident@smartwaste.local',
			phone: '+254700000003',
			password: 'Resident@123',
			role: 'resident',
			residentData: {
				location: { address: 'Westlands, Nairobi', coordinates: { lat: -1.2683, lng: 36.8110 } },
				wasteRecycled: 32,
				totalPickups: 12
			}
		},
		{
			name: 'Collins Collector',
			email: 'collins.collector@smartwaste.local',
			phone: '+254700000004',
			password: 'Collector@123',
			role: 'collector',
			collectorData: {
				vehicle: 'truck',
				licensePlate: 'KDA 123A',
				capacity: 500,
				isAvailable: true,
				currentLocation: { lat: -1.2864, lng: 36.8172, lastUpdated: new Date() }
			}
		},
		{
			name: 'Amina Collector',
			email: 'amina.collector@smartwaste.local',
			phone: '+254700000005',
			password: 'Collector@123',
			role: 'collector',
			collectorData: {
				vehicle: 'van',
				licensePlate: 'KDA 987B',
				capacity: 300,
				isAvailable: true,
				currentLocation: { lat: -1.3000, lng: 36.8000, lastUpdated: new Date() }
			}
		}
	];

	// Prepare bulk ops with hashed passwords for upsert safety
	const ops = [];
	for (const u of rawUsers) {
		const passwordHash = await hashPassword(u.password);
		ops.push({
			updateOne: {
				filter: { email: u.email },
				update: {
					$set: {
						name: u.name,
						email: u.email,
						phone: u.phone,
						role: u.role,
						status: 'active',
						profile: u.profile || {},
						points: u.points || 0,
						tier: u.tier || 'bronze',
						preferences: u.preferences || undefined,
						residentData: u.residentData || undefined,
						collectorData: u.collectorData || undefined,
						adminData: u.adminData || undefined,
						password: passwordHash // ensure hashed on upsert/update
					}
				},
				upsert: true
			}
		});
	}

	await User.bulkWrite(ops, { ordered: false });

	// Return inserted/updated users
	const users = await User.find({ email: { $in: rawUsers.map(u => u.email) } });
	// Map by email
	const map = {};
	for (const u of users) map[u.email] = u;
	return { users: map };
}

async function upsertRewards() {
	const rewards = [
		{ name: 'Eco Tote Bag', description: 'Reusable eco-friendly shopping bag', points: 150, category: 'eco', stock: 100 },
		{ name: 'Digital Airtime 100', description: 'KSh 100 airtime voucher', points: 200, category: 'digital', stock: 200 },
		{ name: 'SmartWaste Silver Badge', description: 'Unlock silver membership perks', points: 500, category: 'membership', stock: 1000 },
		{ name: 'Supermarket Voucher 500', description: 'KSh 500 shopping voucher', points: 800, category: 'voucher', stock: 50 }
	];

	await Reward.bulkWrite(
		rewards.map(r => ({
			updateOne: {
				filter: { name: r.name },
				update: { $set: { ...r, status: 'active' } },
				upsert: true
			}
		})),
		{ ordered: false }
	);
}

async function ensureSystemConfig() {
	// getConfig will create defaults if missing
	const cfg = await SystemConfig.getConfig();
	return cfg;
}

function randFrom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(d, days) {
	const copy = new Date(d);
	copy.setDate(copy.getDate() + days);
	return copy;
}

async function generateSamplePickups(userMap, config) {
	// Clean previously seeded pickups tagged by description flag
	await PickupRequest.deleteMany({ description: /\[seed\]/i });

	const residents = [userMap['jane.resident@smartwaste.local'], userMap['john.resident@smartwaste.local']].filter(Boolean);
	const collectors = [userMap['collins.collector@smartwaste.local'], userMap['amina.collector@smartwaste.local']].filter(Boolean);
	if (residents.length === 0 || collectors.length === 0) return;

	const wasteTypes = ['plastic', 'glass', 'paper', 'metal', 'electronic', 'organic', 'general'];
	const sizes = ['small', 'medium', 'large'];
	const urgencies = ['low', 'medium', 'high'];

	const docs = [];
	for (let i = 0; i < 10; i++) {
		const resident = randFrom(residents);
		const collector = randFrom(collectors);
		const wasteType = randFrom(wasteTypes);
		const wasteSize = randFrom(sizes);
		const urgency = randFrom(urgencies);

		const scheduledDate = addDays(new Date(), Math.floor(Math.random() * 14) + 1);
		const estimatedPoints = config.calculatePoints(wasteType, wasteSize, urgency);

		// derive coordinates near Nairobi
		const lng = 36.80 + Math.random() * 0.05;
		const lat = -1.30 + Math.random() * 0.05;

		docs.push({
			residentId: resident._id,
			collectorId: Math.random() > 0.4 ? collector._id : undefined,
			wasteType,
			wasteSize,
			description: `[seed] Sample ${wasteType} pickup (${wasteSize}, ${urgency})`,
			location: {
				type: 'Point',
				coordinates: [lng, lat],
				address: 'Nairobi, Kenya',
				instructions: 'Leave at gate'
			},
			scheduledDate,
			urgency,
			status: 'pending',
			tracking: { requested: new Date() },
			estimatedPoints,
			estimatedWeight: Math.round(Math.random() * 15) + 2
		});
	}

	if (docs.length) {
		await PickupRequest.insertMany(docs, { ordered: false });
	}
}

async function syncIndexes() {
	await Promise.all([
		User.syncIndexes(),
		Reward.syncIndexes(),
		PickupRequest.syncIndexes(),
		SystemConfig.syncIndexes()
	]);
}

async function main() {
	console.log('Connecting to MongoDB...');
	await connectDB();
	console.log('Connected:', mongoose.connection.host);

	await syncIndexes();

	console.log('Ensuring SystemConfig...');
	const config = await ensureSystemConfig();

	console.log('Upserting Rewards...');
	await upsertRewards();

	console.log('Upserting Users...');
	const { users: userMap } = await upsertUsers();

	console.log('Generating sample PickupRequests...');
	await generateSamplePickups(userMap, config);

	console.log('Seeding complete.');
}

main()
	.catch(err => {
		console.error('Seeding failed:', err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await mongoose.connection.close();
		console.log('MongoDB connection closed.');
	});
