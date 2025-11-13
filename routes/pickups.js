const express = require('express');
const router = express.Router();
const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { protect } = require('../middleware/auth');
const { requireResident, requireCollector, requireAdminOrCollector } = require('../middleware/roleAuth');
const socketRegistry = require('../config/socketRegistry');

// @route   POST /api/pickups/create
// @desc    Resident creates a new pickup request
// @access  Private (Residents only)
router.post('/create', protect, requireResident, async (req, res) => {
    try {
        const { 
            wasteType, 
            wasteSize, 
            description, 
            location, 
            scheduledDate, 
            urgency, 
            photos 
        } = req.body;

        // Validate required fields
        if (!wasteType || !wasteSize || !location || !scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: wasteType, wasteSize, location, scheduledDate'
            });
        }

        // Get system configuration for points calculation
        const systemConfig = await SystemConfig.getConfig();
        
        // Calculate estimated points
        const estimatedPoints = systemConfig.calculatePoints(wasteType, wasteSize, urgency);

        // Create pickup request
        const pickupRequest = await PickupRequest.create({
            residentId: req.user.id,
            wasteType,
            wasteSize,
            description,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                address: location.address,
                instructions: location.instructions
            },
            scheduledDate: new Date(scheduledDate),
            urgency: urgency || 'medium',
            status: 'pending',
            estimatedPoints,
            estimatedWeight: getEstimatedWeight(wasteSize),
            photos: photos || [],
            tracking: {
                requested: new Date()
            }
        });

        // Populate resident data for response
        await pickupRequest.populate('residentId', 'name email phone residentData.location');

        res.status(201).json({
            success: true,
            message: 'Pickup request created successfully',
            data: {
                pickup: pickupRequest,
                estimatedPoints
            }
        });

    } catch (error) {
        console.error('Error creating pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating pickup request: ' + error.message
        });
    }
});

// @route   GET /api/pickups/available
// @desc    Get available pickups for collectors
// @access  Private (Collectors only)
router.get('/available', protect, requireCollector, async (req, res) => {
    try {
        const availablePickups = await PickupRequest.findAvailablePickups();

        res.json({
            success: true,
            data: availablePickups
        });
    } catch (error) {
        console.error('Error fetching available pickups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available pickups: ' + error.message
        });
    }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Helper function to find nearby pickups within a radius
async function findNearbyPickups(pickupLocation, radiusKm = 5, excludeId = null) {
    const [lng, lat] = pickupLocation.coordinates || [];
    if (!lat || !lng) return [];

    // Find all pending pickups
    const allPending = await PickupRequest.find({
        status: 'pending',
        _id: { $ne: excludeId }
    }).populate('residentId', 'residentData.location');

    // Filter by distance
    const nearby = allPending.filter(p => {
        const [pLng, pLat] = p.location?.coordinates || [];
        if (!pLat || !pLng) return false;
        const distance = calculateDistance(lat, lng, pLat, pLng);
        return distance <= radiusKm;
    });

    return nearby;
}

// @route   PATCH /api/pickups/:id/accept
// @desc    Collector accepts a pickup request
// @access  Private (Collectors only)
router.patch('/:id/accept', protect, requireCollector, async (req, res) => {
    try {
        // Ensure collector is available
        const collector = await User.findById(req.user.id);
        if (!collector || !collector.collectorData.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'You must be available to accept new pickups'
            });
        }

        // Get the pickup to check location
        const targetPickup = await PickupRequest.findById(req.params.id);
        if (!targetPickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup request not found'
            });
        }

        // Check for nearby pickups to encourage route optimization
        const nearbyPickups = await findNearbyPickups(targetPickup.location, 5, req.params.id);
        const hasNearbyPickups = nearbyPickups.length > 0;

        // If there are nearby pickups, suggest route optimization but still allow single acceptance
        if (hasNearbyPickups && !req.body.forceSingle) {
            return res.status(200).json({
                success: true,
                message: `Found ${nearbyPickups.length} nearby pickup(s) in the same region. Consider using route optimization to collect multiple pickups efficiently.`,
                data: {
                    nearbyPickups: nearbyPickups.length,
                    suggestion: 'route_optimization',
                    nearbyPickupsList: nearbyPickups.slice(0, 5).map(p => ({
                        id: p._id,
                        location: p.location?.address,
                        wasteType: p.wasteType,
                        wasteSize: p.wasteSize,
                        scheduledDate: p.scheduledDate
                    })),
                    message: 'To accept only this pickup, include "forceSingle: true" in the request body. For better efficiency, use the route optimization feature to collect multiple pickups in one trip.'
                }
            });
        }

        // Atomically set accepted if still pending
        const pickup = await PickupRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { $set: { status: 'accepted', collectorId: req.user.id } },
            { new: true }
        );

        if (!pickup) {
            return res.status(409).json({
                success: false,
                message: 'Pickup has already been accepted by another collector'
            });
        }

        // Update collector assignment
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { 'collectorData.assignedPickups': pickup._id },
            $set: { 'collectorData.isAvailable': false }
        });

        await pickup.populate('residentId', 'name email phone residentData.location');
        await pickup.populate('collectorId', 'name email phone collectorData.vehicle');

        const response = {
            success: true,
            message: 'Pickup accepted successfully',
            data: pickup
        };

        // Add optimization suggestion if nearby pickups exist
        if (hasNearbyPickups) {
            response.optimizationSuggestion = {
                message: `Tip: There are ${nearbyPickups.length} other pickup(s) nearby. Use route optimization to collect multiple pickups efficiently.`,
                nearbyCount: nearbyPickups.length
            };
        }

        res.json(response);

        // Emit status change
        try {
            const io = socketRegistry.getIo();
            if (io) {
                const residentId = pickup.residentId?._id?.toString?.();
                const payload = { pickupId: pickup._id.toString(), status: 'accepted', collectorId: req.user.id };
                if (residentId) io.to(`user_${residentId}`).emit('pickup_status_changed', payload);
                io.to(`collector_${req.user.id}`).emit('pickup_status_changed', payload);
                io.to('admins').emit('pickup_status_changed', payload);
            }
        } catch (_) {}

    } catch (error) {
        console.error('Error accepting pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting pickup: ' + error.message
        });
    }
});

// @route   PATCH /api/pickups/:id/start
// @desc    Collector starts the pickup (in progress)
// @access  Private (Assigned collector only)
router.patch('/:id/start', protect, requireCollector, async (req, res) => {
    try {
        const { estimatedArrival } = req.body;
        const pickup = await PickupRequest.findById(req.params.id);

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup request not found'
            });
        }

        if (pickup.collectorId?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to start this pickup'
            });
        }

        if (pickup.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: `Cannot start pickup. Pickup must be accepted first. Current status: ${pickup.status}`
            });
        }

        pickup.status = 'inProgress';
        
        if (estimatedArrival) {
            pickup.tracking.estimatedArrival = new Date(estimatedArrival);
        }

        await pickup.save();

        res.json({
            success: true,
            message: 'Pickup started successfully',
            data: pickup
        });

        // Emit status change
        try {
            const io = socketRegistry.getIo();
            if (io) {
                const residentId = pickup.residentId?.toString?.() || pickup.residentId;
                const payload = { pickupId: pickup._id.toString(), status: 'inProgress', collectorId: req.user.id };
                if (residentId) io.to(`user_${residentId}`).emit('pickup_status_changed', payload);
                io.to(`collector_${req.user.id}`).emit('pickup_status_changed', payload);
                io.to('admins').emit('pickup_status_changed', payload);
            }
        } catch (_) {}

    } catch (error) {
        console.error('Error starting pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting pickup: ' + error.message
        });
    }
});

// @route   PATCH /api/pickups/:id/location
// @desc    Update collector's current location for real-time tracking
// @access  Private (Assigned collector only)
router.patch('/:id/location', protect, requireCollector, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const pickup = await PickupRequest.findById(req.params.id);

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup request not found'
            });
        }

        if (pickup.collectorId?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update location for this pickup'
            });
        }

        if (!['accepted', 'inProgress'].includes(pickup.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot update location. Invalid pickup status: ${pickup.status}`
            });
        }

        // Update collector location in pickup tracking
        pickup.updateCollectorLocation(latitude, longitude);
        
        // Update collector's current location in user document
        await User.findByIdAndUpdate(req.user.id, {
            $set: {
                'collectorData.currentLocation': {
                    lat: latitude,
                    lng: longitude,
                    lastUpdated: new Date()
                }
            }
        });

        await pickup.save();

        // Emit realtime location to resident and admins
        try {
            const io = socketRegistry.getIo();
            if (io) {
                const residentId = pickup.residentId?.toString?.() || pickup.residentId;
                const collectorId = req.user.id;
                const payload = {
                    pickupId: pickup._id.toString(),
                    latitude,
                    longitude,
                    collectorId,
                    lastUpdated: new Date().toISOString()
                };
                if (residentId) io.to(`user_${residentId}`).emit('collector_location', payload);
                io.to('admins').emit('collector_location_update', payload);
            }
        } catch (e) {
            // non-fatal
        }

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: {
                location: { lat: latitude, lng: longitude },
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating location: ' + error.message
        });
    }
});

// @route   PATCH /api/pickups/:id/complete
// @desc    Collector completes the pickup
// @access  Private (Assigned collector only)
router.patch('/:id/complete', protect, requireCollector, async (req, res) => {
    try {
        const { actualWeight, collectorNotes } = req.body;
        const pickup = await PickupRequest.findById(req.params.id);

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup request not found'
            });
        }

        if (pickup.collectorId?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to complete this pickup'
            });
        }

        if (pickup.status !== 'inProgress') {
            return res.status(400).json({
                success: false,
                message: `Cannot complete pickup. Pickup must be in progress. Current status: ${pickup.status}`
            });
        }

        const latest = pickup.tracking.collectorLocation && pickup.tracking.collectorLocation.length > 0
            ? pickup.tracking.collectorLocation[pickup.tracking.collectorLocation.length - 1]
            : null;
        if (latest) {
            const [lng, lat] = pickup.location.coordinates;
            const distance = getDistanceMeters(lat, lng, latest.lat, latest.lng);
            const threshold = 100;
            if (distance > threshold) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot complete pickup. Collector is not within range (${Math.round(distance)}m)`
                });
            }
        }

        pickup.completePickup(actualWeight, collectorNotes);
        const computedPoints = computeActualPoints(pickup.wasteType, pickup.wasteSize, actualWeight);
        pickup.actualPoints = computedPoints > 0 ? computedPoints : pickup.estimatedPoints;

        await pickup.save();

        await User.findByIdAndUpdate(pickup.residentId, {
            $inc: {
                points: pickup.actualPoints,
                'residentData.totalPickups': 1,
                'residentData.wasteRecycled': actualWeight || 0
            }
        });

        // Update collector stats
        await User.findByIdAndUpdate(req.user.id, {
            $inc: {
                'collectorData.stats.completedPickups': 1,
                'collectorData.stats.totalWasteCollected': actualWeight || 0
            },
            $pull: { 'collectorData.assignedPickups': pickup._id },
            $set: { 'collectorData.isAvailable': true }
        });

        // Check and update resident tier
        await updateResidentTier(pickup.residentId);

        await pickup.populate('residentId', 'name email points tier');
        await pickup.populate('collectorId', 'name email collectorData.stats');

        res.json({
            success: true,
            message: 'Pickup completed successfully',
            data: {
                pickup,
                pointsAwarded: pickup.actualPoints,
                wasteCollected: actualWeight
            }
        });

        // Emit status change
        try {
            const io = socketRegistry.getIo();
            if (io) {
                const residentId = pickup.residentId?._id?.toString?.() || pickup.residentId;
                const payload = { pickupId: pickup._id.toString(), status: 'completed', collectorId: req.user.id };
                if (residentId) io.to(`user_${residentId}`).emit('pickup_status_changed', payload);
                io.to(`collector_${req.user.id}`).emit('pickup_status_changed', payload);
                io.to('admins').emit('pickup_status_changed', payload);
            }
        } catch (_) {}

    } catch (error) {
        console.error('Error completing pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing pickup: ' + error.message
        });
    }
});

// @route   PATCH /api/pickups/:id/cancel
// @desc    Cancel a pickup request
// @access  Private (Resident owner or Admin)
router.patch('/:id/cancel', protect, async (req, res) => {

    try {
        const { reason } = req.body;
        const pickup = await PickupRequest.findById(req.params.id);

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup request not found'
            });
        }

        // Check authorization
        const isResidentOwner = pickup.residentId.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        if (!isResidentOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this pickup'
            });
        }

        if (['completed', 'cancelled'].includes(pickup.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel pickup. Current status: ${pickup.status}`
            });
        }

        // If collector was assigned, make them available again
        if (pickup.collectorId) {
            await User.findByIdAndUpdate(pickup.collectorId, {
                $pull: { 'collectorData.assignedPickups': pickup._id },
                $set: { 'collectorData.isAvailable': true }
            });
        }

        pickup.status = 'cancelled';
        pickup.collectorNotes = reason || 'Cancelled by user';

        await pickup.save();

        res.json({
            success: true,
            message: 'Pickup cancelled successfully',
            data: pickup
        });

    } catch (error) {
        console.error('Error cancelling pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling pickup: ' + error.message
        });
    }
});

// @route   GET /api/pickups/resident
// @desc    Get all pickups for the current resident
// @access  Private (Residents only)
router.get('/resident', protect, requireResident, async (req, res) => {
    try {
        const pickups = await PickupRequest.findByResident(req.user.id);

        res.json({
            success: true,
            data: pickups
        });
    } catch (error) {
        console.error('Error fetching resident pickups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pickup history: ' + error.message
        });
    }
});

// @route   GET /api/pickups/collector
// @desc    Get active pickups for the current collector
// @access  Private (Collectors only)
router.get('/collector', protect, requireCollector, async (req, res) => {
    try {
        const pickups = await PickupRequest.findByCollector(req.user.id);

        res.json({
            success: true,
            data: pickups
        });
    } catch (error) {
        console.error('Error fetching collector pickups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assigned pickups: ' + error.message
        });
    }
});

// @route   GET /api/pickups/:id
// @desc    Get specific pickup details
// @access  Private (Resident, Assigned Collector, or Admin)
router.get('/:id', protect, async (req, res) => {
    try {
        const pickup = await PickupRequest.findById(req.params.id)
            .populate('residentId', 'name email phone residentData.location')
            .populate('collectorId', 'name email phone collectorData.vehicle collectorData.currentLocation');

        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup request not found'
            });
        }

        // Check authorization
        const isResidentOwner = pickup.residentId._id.toString() === req.user.id;
        const isAssignedCollector = pickup.collectorId?._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isResidentOwner && !isAssignedCollector && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this pickup'
            });
        }

        res.json({
            success: true,
            data: pickup
        });

    } catch (error) {
        console.error('Error fetching pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pickup details: ' + error.message
        });
    }
});

// Helper function to estimate weight based on waste size
function getEstimatedWeight(wasteSize) {
    const weightMap = {
        'small': 3,
        'medium': 10,
        'large': 20
    };
    return weightMap[wasteSize] || 5;
}

// Helper function to update resident tier
async function updateResidentTier(residentId) {
    try {
        const resident = await User.findById(residentId);
        if (resident && resident.role === 'resident') {
            resident.updateTier();
            await resident.save();
        }
    } catch (error) {
        console.error('Error updating resident tier:', error);
    }
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function computeActualPoints(wasteType, wasteSize, actualWeight) {
    const perKg = { plastic: 5, glass: 3, organic: 2, metal: 8 };
    if (typeof actualWeight === 'number' && actualWeight > 0 && perKg[wasteType]) {
        return Math.round(actualWeight * perKg[wasteType]);
    }
    const sizeFallback = { small: 5, medium: 10, large: 20 };
    return sizeFallback[wasteSize] || 0;
}

module.exports = router;