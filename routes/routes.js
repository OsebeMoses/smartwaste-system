const express = require('express');

const router = express.Router();
const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const Route = require('../models/Route');
const { protect } = require('../middleware/auth');
const { requireCollector, requireAdminOrCollector } = require('../middleware/roleAuth');

// Feature flag: set ENABLE_SMART_ROUTING=false to disable without removing code
const ENABLE_SMART_ROUTING = process.env.ENABLE_SMART_ROUTING !== 'false';

// --- Helpers ---
function toRadians(deg) {
	return (deg * Math.PI) / 180;
}

function haversineDistanceKm(a, b) {
	// a and b: { lat, lng }
	const R = 6371; // km
	const dLat = toRadians((b.lat || 0) - (a.lat || 0));
	const dLng = toRadians((b.lng || 0) - (a.lng || 0));
	const lat1 = toRadians(a.lat || 0);
	const lat2 = toRadians(b.lat || 0);
	const sinDLat = Math.sin(dLat / 2);
	const sinDLng = Math.sin(dLng / 2);
	const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng));
	return R * c;
}

function daysSince(dateStr) {
	if (!dateStr) return Number.POSITIVE_INFINITY;
	const then = new Date(dateStr).getTime();
	if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
	const now = Date.now();
	return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

function scoreRequest(reqItem, weights) {
	const fillScore = (reqItem.fillLevel || 0) / 100; // 0..1
	const days = daysSince(reqItem.lastCollectedAt);
	const daysScore = Math.min(1, days / (reqItem.maxWaitDays || 7));
	const slaScore = (reqItem.priority || 0) / 10; // assume 0..10
	return (weights.fill * fillScore) + (weights.days * daysScore) + (weights.sla * slaScore);
}

function nearestNeighborRoute({ depot, candidates }) {
	const remaining = candidates.slice();
	const ordered = [];
	let current = { location: depot };
	let totalDistanceKm = 0;

	while (remaining.length > 0) {
		let bestIdx = 0;
		let bestDist = Number.POSITIVE_INFINITY;
		for (let i = 0; i < remaining.length; i++) {
			const dist = haversineDistanceKm(current.location, remaining[i].location);
			if (dist < bestDist) {
				bestDist = dist;
				bestIdx = i;
			}
		}
		const next = remaining.splice(bestIdx, 1)[0];
		next._distanceFromPrevKm = bestDist === Number.POSITIVE_INFINITY ? 0 : bestDist;
		totalDistanceKm += (next._distanceFromPrevKm || 0);
		ordered.push(next);
		current = next;
	}

	// Return to depot distance (optional for reporting)
	const returnDistanceKm = ordered.length > 0 ? haversineDistanceKm(current.location, depot) : 0;
	totalDistanceKm += returnDistanceKm;

	return { stops: ordered, totalDistanceKm, returnDistanceKm };
}

// --- Routes ---
router.get('/health', (req, res) => {
	return res.status(200).json({ success: true, enabled: ENABLE_SMART_ROUTING });
});

// POST /api/routes/generate
// Body expects a self-contained payload to avoid breaking existing DB flows.
// {
//   depot: { lat, lng },
//   capacityLiters: number,
//   thresholdPercent?: number (default 65),
//   criticalThresholdPercent?: number (default 85),
//   maxWaitDays?: number (default 7),
//   weights?: { fill: 0.6, days: 0.3, sla: 0.1 },
//   zones?: string[] (optional filter),
//   requests: [
//     { id, zone?, location:{lat,lng}, fillLevel, volumeLiters, lastCollectedAt?, priority? }
//   ]
// }
router.post('/generate', (req, res) => {
	try {
		if (!ENABLE_SMART_ROUTING) {
			return res.status(503).json({ success: false, message: 'Smart routing disabled by flag' });
		}

		const body = req.body || {};
		const depot = body.depot;
		const capacityLiters = Number(body.capacityLiters || 0);
		const threshold = Number(body.thresholdPercent ?? 65);
		const critical = Number(body.criticalThresholdPercent ?? 85);
		const maxWaitDays = Number(body.maxWaitDays ?? 7);
		const zonesFilter = Array.isArray(body.zones) ? body.zones : null;
		const weights = {
			fill: (body.weights && typeof body.weights.fill === 'number') ? body.weights.fill : 0.6,
			days: (body.weights && typeof body.weights.days === 'number') ? body.weights.days : 0.3,
			sla: (body.weights && typeof body.weights.sla === 'number') ? body.weights.sla : 0.1
		};

		if (!depot || typeof depot.lat !== 'number' || typeof depot.lng !== 'number') {
			return res.status(400).json({ success: false, message: 'Invalid or missing depot {lat,lng}' });
		}
		if (!Array.isArray(body.requests)) {
			return res.status(400).json({ success: false, message: 'requests must be an array' });
		}

		const allRequests = body.requests.map(r => ({
			id: r.id,
			zone: r.zone,
			location: r.location || {},
			fillLevel: Number(r.fillLevel || 0),
			volumeLiters: Number(r.volumeLiters || 0),
			lastCollectedAt: r.lastCollectedAt,
			priority: Number(r.priority || 0),
			maxWaitDays
		}));

		// Zone filter (if provided)
		let candidates = zonesFilter ? allRequests.filter(r => zonesFilter.includes(r.zone)) : allRequests.slice();

		// Threshold and overdue logic
		const included = [];
		const excluded = [];
		for (const r of candidates) {
			const overdue = daysSince(r.lastCollectedAt) >= maxWaitDays;
			if (r.fillLevel >= critical || r.fillLevel >= threshold || overdue) {
				included.push(r);
			} else {
				excluded.push(r);
			}
		}

		// Score and sort by priority within the included set
		included.sort((a, b) => scoreRequest(b, weights) - scoreRequest(a, weights));

		// Capacity-aware selection
		const selected = [];
		let usedCapacity = 0;
		for (const r of included) {
			if (capacityLiters > 0 && (usedCapacity + r.volumeLiters) > capacityLiters) continue;
			selected.push(r);
			usedCapacity += r.volumeLiters;
		}

		// Build route with nearest-neighbor
		const routed = nearestNeighborRoute({ depot, candidates: selected });

		// Produce stops with cumulative volume and step distances
		let cumulativeVolume = 0;
		const stops = routed.stops.map((r, idx) => {
			cumulativeVolume += r.volumeLiters;
			return {
				order: idx + 1,
				requestId: r.id,
				zone: r.zone,
				location: r.location,
				fillLevel: r.fillLevel,
				volumeLiters: r.volumeLiters,
				distanceFromPrevKm: Number((r._distanceFromPrevKm || 0).toFixed(3)),
				cumulativeVolumeLiters: cumulativeVolume
			};
		});

		return res.status(200).json({
			success: true,
			params: {
				thresholdPercent: threshold,
				criticalThresholdPercent: critical,
				maxWaitDays,
				weights,
				capacityLiters
			},
			metrics: {
				numRequestsInput: allRequests.length,
				numExcluded: excluded.length,
				numSelected: selected.length,
				totalSelectedVolumeLiters: selected.reduce((s, r) => s + r.volumeLiters, 0)
			},
			depot,
			stops,
			totalDistanceKm: Number((routed.totalDistanceKm || 0).toFixed(3)),
			returnToDepotDistanceKm: Number((routed.returnDistanceKm || 0).toFixed(3))
		});
	} catch (err) {
		console.error('Route generation error:', err);
		return res.status(500).json({ success: false, message: 'Failed to generate route' });
	}
});

module.exports = router;

// ===== DB-BACKED GENERATION (SAFE, FEATURE-FLAGGED) =====
// POST /api/routes/generate/from-db
// Uses authenticated collector's capacity and location as depot, fetches pending pickups
router.post('/generate/from-db', protect, requireAdminOrCollector, async (req, res) => {
	try {
		if (!ENABLE_SMART_ROUTING) {
			return res.status(503).json({ success: false, message: 'Smart routing disabled by flag' });
		}

		const userId = req.user._id.toString();
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		// Depot: collector current location or provided override
		const bodyDepot = req.body && req.body.depot;
		const depot = bodyDepot && typeof bodyDepot.lat === 'number' && typeof bodyDepot.lng === 'number'
			? bodyDepot
			: (user.collectorData && user.collectorData.currentLocation && typeof user.collectorData.currentLocation.lat === 'number' && typeof user.collectorData.currentLocation.lng === 'number'
				? { lat: user.collectorData.currentLocation.lat, lng: user.collectorData.currentLocation.lng }
				: null);
		if (!depot) {
			return res.status(400).json({ success: false, message: 'Depot location required (provide in body or set collector currentLocation)' });
		}

		// Capacity (kg) with optional override
		const capacityKg = Number(req.body?.capacityKg ?? (user.collectorData?.capacity || 100));

		// Optional filters and params
		const threshold = Number(req.body?.thresholdPercent ?? 65);
		const critical = Number(req.body?.criticalThresholdPercent ?? 85);
		const maxWaitDays = Number(req.body?.maxWaitDays ?? 7);
		const zonesFilter = Array.isArray(req.body?.zones) ? req.body.zones : null;
		const weights = {
			fill: (req.body?.weights && typeof req.body.weights.fill === 'number') ? req.body.weights.fill : 0.6,
			days: (req.body?.weights && typeof req.body.weights.days === 'number') ? req.body.weights.days : 0.3,
			sla: (req.body?.weights && typeof req.body.weights.sla === 'number') ? req.body.weights.sla : 0.1
		};

		// Fetch candidate pickups: pending and scheduled in future (or allow today)
		const now = new Date();
		const candidatesDb = await PickupRequest.find({
			status: 'pending',
			scheduledDate: { $gte: new Date(now.getTime() - 30 * 60 * 1000) } // allow slight past for flexibility
		}).populate('residentId', 'residentData.location.address');

		// Map DB docs to routing schema
		const urgencyToFill = (urgency) => {
			switch (urgency) {
				case 'high': return 88;
				case 'medium': return 65;
				case 'low': return 50;
				default: return 60;
			}
		};

		const sizeToWeight = (size) => {
			switch (size) {
				case 'small': return 3;
				case 'medium': return 10;
				case 'large': return 20;
				default: return 5;
			}
		};

		let mapped = candidatesDb.map(doc => {
			const [lng, lat] = Array.isArray(doc.location?.coordinates) ? doc.location.coordinates : [null, null];
			const address = doc.location?.address || doc.residentId?.residentData?.location?.address || '';
			const estWeight = typeof doc.estimatedWeight === 'number' ? doc.estimatedWeight : sizeToWeight(doc.wasteSize);
			return {
				id: doc._id.toString(),
				zone: address,
				location: { lat: Number(lat), lng: Number(lng) },
				fillLevel: urgencyToFill(doc.urgency),
				volumeLiters: estWeight, // using kg as capacity unit for routing consistency
				lastCollectedAt: doc.tracking?.completed || doc.updatedAt,
				priority: doc.urgency === 'high' ? 7 : (doc.urgency === 'medium' ? 5 : 3),
				maxWaitDays
			};
		}).filter(r => Number.isFinite(r.location.lat) && Number.isFinite(r.location.lng));

		// Optional zones/address filter (substring match)
		if (zonesFilter && zonesFilter.length > 0) {
			const lowered = zonesFilter.map(z => String(z).toLowerCase());
			mapped = mapped.filter(r => {
				const z = String(r.zone || '').toLowerCase();
				return lowered.some(s => z.includes(s));
			});
		}

		// Reuse selection + routing from in-memory endpoint
		const body = {
			depot,
			capacityLiters: capacityKg,
			thresholdPercent: threshold,
			criticalThresholdPercent: critical,
			maxWaitDays,
			weights,
			requests: mapped
		};

		// Inline call to same logic as /generate
		const allRequests = body.requests;
		let candidates = allRequests.slice();
		const included = [];
		const excluded = [];
		for (const r of candidates) {
			const overdue = daysSince(r.lastCollectedAt) >= maxWaitDays;
			if (r.fillLevel >= critical || r.fillLevel >= threshold || overdue) {
				included.push(r);
			} else {
				excluded.push(r);
			}
		}
		included.sort((a, b) => scoreRequest(b, weights) - scoreRequest(a, weights));
		const selected = [];
		let usedCapacity = 0;
		for (const r of included) {
			if (capacityKg > 0 && (usedCapacity + r.volumeLiters) > capacityKg) continue;
			selected.push(r);
			usedCapacity += r.volumeLiters;
		}
		const routed = nearestNeighborRoute({ depot, candidates: selected });
		let cumulativeVolume = 0;
		const stops = routed.stops.map((r, idx) => {
			cumulativeVolume += r.volumeLiters;
			return {
				order: idx + 1,
				requestId: r.id,
				zone: r.zone,
				location: r.location,
				fillLevel: r.fillLevel,
				volumeKg: r.volumeLiters,
				distanceFromPrevKm: Number((r._distanceFromPrevKm || 0).toFixed(3)),
				cumulativeVolumeKg: cumulativeVolume
			};
		});

		return res.status(200).json({
			success: true,
			params: {
				thresholdPercent: threshold,
				criticalThresholdPercent: critical,
				maxWaitDays,
				weights,
				capacityKg
			},
			metrics: {
				numRequestsInput: allRequests.length,
				numExcluded: excluded.length,
				numSelected: selected.length,
				totalSelectedKg: selected.reduce((s, r) => s + r.volumeLiters, 0)
			},
			depot,
			stops,
			totalDistanceKm: Number((routed.totalDistanceKm || 0).toFixed(3)),
			returnToDepotDistanceKm: Number((routed.returnDistanceKm || 0).toFixed(3))
		});

	} catch (err) {
		console.error('DB route generation error:', err);
		return res.status(500).json({ success: false, message: 'Failed to generate route from DB' });
	}
});

// ===== ASSIGN AND PERSIST ROUTE =====
// POST /api/routes/assign/from-db
// Generates a route from DB then persists it, updating pickups and collector assignments
router.post('/assign/from-db', protect, requireAdminOrCollector, async (req, res) => {
	try {
		if (!ENABLE_SMART_ROUTING) {
			return res.status(503).json({ success: false, message: 'Smart routing disabled by flag' });
		}

		// First, reuse the in-file generation to get planned stops
		const fauxRes = {
			status: () => ({ json: (obj) => obj })
		};
		const genReq = { ...req };
		let generated;
		await (async () => {
			generated = await new Promise((resolve, reject) => {
				// Call the handler directly
				const handler = router.stack.find(l => l.route && l.route.path === '/generate/from-db' && l.route.methods.post);
				if (!handler) return reject(new Error('Generation handler not found'));
				const layerHandle = handler.route.stack[0].handle;
				// We need to call after auth and role; we are already in protected route
				try {
					layerHandle(genReq, {
						status: (code) => ({ json: (obj) => resolve({ code, obj }) })
					});
				} catch (e) { reject(e); }
			});
		})();

		if (!generated || !generated.obj || !generated.obj.success) {
			return res.status(generated?.code || 500).json(generated?.obj || { success: false, message: 'Failed to generate route' });
		}

		const plan = generated.obj;
		const collectorId = req.user._id;

		// Create Route document
		const routeDoc = await Route.create({
			collectorId,
			status: 'planned',
			depot: plan.depot,
			capacityKg: plan.params.capacityKg || plan.params.capacityLiters || 0,
			params: {
				thresholdPercent: plan.params.thresholdPercent,
				criticalThresholdPercent: plan.params.criticalThresholdPercent,
				maxWaitDays: plan.params.maxWaitDays,
				weights: plan.params.weights,
				zones: req.body?.zones || []
			},
			metrics: {
				totalDistanceKm: plan.totalDistanceKm,
				returnToDepotDistanceKm: plan.returnToDepotDistanceKm,
				totalSelectedKg: plan.metrics.totalSelectedKg || plan.metrics.totalSelectedVolumeLiters,
				numStops: plan.stops.length
			},
			stops: plan.stops.map(s => ({
				order: s.order,
				pickupId: s.requestId,
				zone: s.zone,
				location: s.location,
				plannedWeightKg: s.volumeKg || s.volumeLiters || 0,
				distanceFromPrevKm: s.distanceFromPrevKm,
				status: 'pending'
			}))
		});

		// Update pickups: set accepted and assign to collector if pending
		const pickupIds = routeDoc.stops.map(s => s.pickupId);
		await PickupRequest.updateMany(
			{ _id: { $in: pickupIds }, status: 'pending' },
			{ $set: { status: 'accepted', collectorId } }
		);

		// Add to collector assignedPickups
		await User.findByIdAndUpdate(collectorId, {
			$addToSet: { 'collectorData.assignedPickups': { $each: pickupIds } },
			$set: { 'collectorData.isAvailable': false }
		});

		return res.status(201).json({ success: true, data: routeDoc });
	} catch (err) {
		console.error('Assign route error:', err);
		return res.status(500).json({ success: false, message: 'Failed to assign route' });
	}
});

// GET /api/routes/:routeId
router.get('/:routeId', protect, requireAdminOrCollector, async (req, res) => {
	try {
		const route = await Route.findById(req.params.routeId)
			.populate('collectorId', 'name email collectorData.vehicle')
			.populate('stops.pickupId');
		if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
		if (req.user.role === 'collector' && route.collectorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: 'Not authorized to view this route' });
		}
		return res.json({ success: true, data: route });
	} catch (err) {
		console.error('Fetch route error:', err);
		return res.status(500).json({ success: false, message: 'Failed to fetch route' });
	}
});

// POST /api/routes/:routeId/start
router.post('/:routeId/start', protect, requireAdminOrCollector, async (req, res) => {
	try {
		const route = await Route.findById(req.params.routeId);
		if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
		if (req.user.role === 'collector' && route.collectorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: 'Not authorized to start this route' });
		}
		if (route.status !== 'planned') {
			return res.status(400).json({ success: false, message: `Cannot start route in status ${route.status}` });
		}
		route.status = 'inProgress';
		route.startedAt = new Date();
		await route.save();
		return res.json({ success: true, data: route });
	} catch (err) {
		console.error('Start route error:', err);
		return res.status(500).json({ success: false, message: 'Failed to start route' });
	}
});

// POST /api/routes/:routeId/stops/:stopId/complete
router.post('/:routeId/stops/:stopId/complete', protect, requireAdminOrCollector, async (req, res) => {
	try {
		const route = await Route.findById(req.params.routeId);
		if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
		if (req.user.role === 'collector' && route.collectorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: 'Not authorized to update this route' });
		}
		const stop = route.stops.id(req.params.stopId);
		if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });
		if (stop.status === 'completed') {
			return res.status(200).json({ success: true, data: route });
		}
		stop.status = 'completed';
		stop.completedAt = new Date();
		await route.save();

		// Also mark pickup inProgress->completed flow if needed (only if already started)
		const pickup = await PickupRequest.findById(stop.pickupId);
		if (pickup) {
			if (pickup.status === 'accepted') {
				pickup.status = 'inProgress';
			}
			if (pickup.status === 'inProgress') {
				pickup.status = 'completed';
				pickup.completedDate = new Date();
			}
			await pickup.save();
		}

		return res.json({ success: true, data: route });
	} catch (err) {
		console.error('Complete stop error:', err);
		return res.status(500).json({ success: false, message: 'Failed to complete stop' });
	}
});

// POST /api/routes/:routeId/stops/:stopId/skip
router.post('/:routeId/stops/:stopId/skip', protect, requireAdminOrCollector, async (req, res) => {
	try {
		const { reason } = req.body || {};
		const route = await Route.findById(req.params.routeId);
		if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
		if (req.user.role === 'collector' && route.collectorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: 'Not authorized to update this route' });
		}
		const stop = route.stops.id(req.params.stopId);
		if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });
		if (stop.status === 'completed') {
			return res.status(400).json({ success: false, message: 'Cannot skip a completed stop' });
		}
		stop.status = 'skipped';
		stop.notes = reason || 'Skipped by collector';
		await route.save();

		// Reset pickup to pending and unassign from collector so others can take it
		const pickup = await PickupRequest.findById(stop.pickupId);
		if (pickup) {
			if (['accepted', 'inProgress'].includes(pickup.status)) {
				pickup.status = 'pending';
				pickup.collectorId = undefined;
				await pickup.save();
			}
			// Remove from collector assignedPickups
			await User.findByIdAndUpdate(route.collectorId, {
				$pull: { 'collectorData.assignedPickups': pickup._id }
			});
		}

		// If all stops are either completed or skipped, mark route completed
		const allDone = route.stops.every(s => s.status === 'completed' || s.status === 'skipped');
		if (allDone && route.status !== 'completed') {
			route.status = 'completed';
			route.completedAt = new Date();
			await route.save();
			// Mark collector available again
			await User.findByIdAndUpdate(route.collectorId, { $set: { 'collectorData.isAvailable': true } });
		}

		return res.json({ success: true, data: route });
	} catch (err) {
		console.error('Skip stop error:', err);
		return res.status(500).json({ success: false, message: 'Failed to skip stop' });
	}
});

// GET /api/routes/me/today
// Returns the latest planned or inProgress route for the authenticated collector for today
router.get('/me/today', protect, requireCollector, async (req, res) => {
	try {
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date();
		endOfDay.setHours(23, 59, 59, 999);

		// Prefer today's inProgress then planned, otherwise fallback to most recent
		let route = await Route.findOne({
			collectorId: req.user._id,
			status: { $in: ['planned', 'inProgress'] },
			createdAt: { $gte: startOfDay, $lte: endOfDay }
		})
		.sort({ status: 1, createdAt: -1 })
		.populate('stops.pickupId');

		if (!route) {
			route = await Route.findOne({ collectorId: req.user._id, status: { $in: ['planned', 'inProgress'] } })
				.sort({ createdAt: -1 })
				.populate('stops.pickupId');
		}

		if (!route) return res.json({ success: true, data: null });
		return res.json({ success: true, data: route });
	} catch (err) {
		console.error('Fetch today route error:', err);
		return res.status(500).json({ success: false, message: 'Failed to fetch today\'s route' });
	}
});



