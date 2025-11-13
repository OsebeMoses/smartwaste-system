const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
	order: { type: Number, required: true },
	pickupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupRequest', required: true },
	zone: String,
	location: {
		lat: Number,
		lng: Number
	},
	plannedWeightKg: { type: Number, default: 0 },
	distanceFromPrevKm: { type: Number, default: 0 },
	status: { type: String, enum: ['pending', 'skipped', 'completed'], default: 'pending' },
	completedAt: Date,
	notes: String
}, { _id: true });

const routeSchema = new mongoose.Schema({
	collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	status: { type: String, enum: ['planned', 'inProgress', 'completed', 'cancelled'], default: 'planned', index: true },
	depot: { lat: Number, lng: Number },
	capacityKg: { type: Number, default: 0 },
	params: {
		thresholdPercent: Number,
		criticalThresholdPercent: Number,
		maxWaitDays: Number,
		weights: { fill: Number, days: Number, sla: Number },
		zones: [String]
	},
	metrics: {
		totalDistanceKm: Number,
		returnToDepotDistanceKm: Number,
		totalSelectedKg: Number,
		numStops: Number
	},
	stops: [routeStopSchema],
	startedAt: Date,
	completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);


