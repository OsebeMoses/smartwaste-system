const express = require('express');
const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { protect } = require('../middleware/auth');
const { requireCollector } = require('../middleware/roleAuth');

const router = express.Router();

// All routes in this file are protected and require collector role
router.use(protect);
router.use(requireCollector);

// @desc    Get collector dashboard data
// @route   GET /api/collectors/dashboard
// @access  Private (Collector only)
router.get('/dashboard', async (req, res) => {
    try {
        const collector = await User.findById(req.user.id);
        
        // Get available pickups
        const availablePickups = await PickupRequest.findAvailablePickups();
        
        // Get active pickups (accepted or in progress)
        const activePickups = await PickupRequest.findByCollector(req.user.id);
        
        // Get today's completed pickups
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCompleted = await PickupRequest.countDocuments({
            collectorId: req.user.id,
            status: 'completed',
            'tracking.completed': { $gte: today }
        });

        res.json({
            success: true,
            data: {
                collector: {
                    name: collector.name,
                    vehicle: collector.collectorData.vehicle,
                    isAvailable: collector.collectorData.isAvailable,
                    stats: collector.collectorData.stats
                },
                availablePickups: availablePickups.length,
                activePickups: activePickups.length,
                todayCompleted,
                pickups: {
                    available: availablePickups,
                    active: activePickups
                }
            }
        });

    } catch (error) {
        console.error('Error fetching collector dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data: ' + error.message
        });
    }
});

// @desc    Get available pickup requests
// @route   GET /api/collectors/pickups/available
// @access  Private (Collector only)
router.get('/pickups/available', async (req, res) => {
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

// @desc    Get nearby pickups for route optimization
// @route   GET /api/collectors/pickups/nearby
// @access  Private (Collector only)
router.get('/pickups/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const location = {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
        };

        const nearbyPickups = await findNearbyPickups(location, parseFloat(radius));

        res.json({
            success: true,
            data: {
                count: nearbyPickups.length,
                pickups: nearbyPickups.map(p => ({
                    id: p._id,
                    location: p.location?.address,
                    coordinates: p.location?.coordinates,
                    wasteType: p.wasteType,
                    wasteSize: p.wasteSize,
                    scheduledDate: p.scheduledDate,
                    urgency: p.urgency
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching nearby pickups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching nearby pickups: ' + error.message
        });
    }
});

// @desc    Get collector's active pickups
// @route   GET /api/collectors/pickups/active
// @access  Private (Collector only)
router.get('/pickups/active', async (req, res) => {
    try {
        const activePickups = await PickupRequest.findByCollector(req.user.id);

        res.json({
            success: true,
            data: activePickups
        });

    } catch (error) {
        console.error('Error fetching active pickups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active pickups: ' + error.message
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

// @desc    Accept a pickup request
// @route   PATCH /api/collectors/pickups/:id/accept
// @access  Private (Collector only)
router.patch('/pickups/:id/accept', async (req, res) => {
    try {
        // Check if collector is available
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

        // Atomically accept only if still pending
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

        // Update collector's status
        await User.findByIdAndUpdate(req.user.id, {
            $set: { 'collectorData.isAvailable': false },
            $addToSet: { 'collectorData.assignedPickups': pickup._id }
        });

        await pickup.populate('residentId', 'name email phone residentData.location');

        const response = {
            success: true,
            message: 'Pickup request accepted successfully',
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

    } catch (error) {
        console.error('Error accepting pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting pickup: ' + error.message
        });
    }
});

// @desc    Start a pickup (mark as in progress)
// @route   PATCH /api/collectors/pickups/:id/start
// @access  Private (Collector only)
router.patch('/pickups/:id/start', async (req, res) => {
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

    } catch (error) {
        console.error('Error starting pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting pickup: ' + error.message
        });
    }
});

// @desc    Update collector's current location
// @route   PATCH /api/collectors/pickups/:id/location
// @access  Private (Collector only)
router.patch('/pickups/:id/location', async (req, res) => {
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

// @desc    Complete a pickup request
// @route   PATCH /api/collectors/pickups/:id/complete
// @access  Private (Collector only)
router.patch('/pickups/:id/complete', async (req, res) => {
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

        // Complete the pickup
        pickup.completePickup(actualWeight, collectorNotes);
        pickup.actualPoints = pickup.estimatedPoints;

        await pickup.save();

        // Award points to resident
        await User.findByIdAndUpdate(pickup.residentId, {
            $inc: {
                points: pickup.actualPoints,
                'residentData.totalPickups': 1,
                'residentData.wasteRecycled': actualWeight || 0
            }
        });

        // Update collector stats and make available again
        await User.findByIdAndUpdate(req.user.id, {
            $inc: {
                'collectorData.stats.completedPickups': 1,
                'collectorData.stats.totalWasteCollected': actualWeight || 0
            },
            $pull: { 'collectorData.assignedPickups': pickup._id },
            $set: { 'collectorData.isAvailable': true }
        });

        await pickup.populate('residentId', 'name email points tier');

        res.json({
            success: true,
            message: 'Pickup completed successfully',
            data: {
                pickup,
                pointsAwarded: pickup.actualPoints,
                wasteCollected: actualWeight
            }
        });

    } catch (error) {
        console.error('Error completing pickup:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing pickup: ' + error.message
        });
    }
});

// @desc    Update collector availability status
// @route   PATCH /api/collectors/availability
// @access  Private (Collector only)
router.patch('/availability', async (req, res) => {
    try {
        const { isAvailable } = req.body;

        const collector = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: { 'collectorData.isAvailable': isAvailable }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
            data: {
                isAvailable: collector.collectorData.isAvailable
            }
        });

    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating availability: ' + error.message
        });
    }
});

// @desc    Get collector profile and stats
// @route   GET /api/collectors/profile
// @access  Private (Collector only)
router.get('/profile', async (req, res) => {
    try {
        const collector = await User.findById(req.user.id);
        
        // Get recent completed pickups
        const recentPickups = await PickupRequest.find({
            collectorId: req.user.id,
            status: 'completed'
        })
        .populate('residentId', 'name residentData.location.address')
        .sort({ 'tracking.completed': -1 })
        .limit(5);

        res.json({
            success: true,
            data: {
                collector: {
                    name: collector.name,
                    email: collector.email,
                    phone: collector.phone,
                    vehicle: collector.collectorData.vehicle,
                    licensePlate: collector.collectorData.licensePlate,
                    capacity: collector.collectorData.capacity,
                    isAvailable: collector.collectorData.isAvailable,
                    stats: collector.collectorData.stats,
                    currentLocation: collector.collectorData.currentLocation
                },
                recentPickups
            }
        });

    } catch (error) {
        console.error('Error fetching collector profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile: ' + error.message
        });
    }
});

// @desc    Update collector profile
// @route   PUT /api/collectors/profile
// @access  Private (Collector only)
router.put('/profile', async (req, res) => {
    try {
        const { vehicle, licensePlate, capacity, phone } = req.body;

        const updateData = {};
        if (vehicle) updateData['collectorData.vehicle'] = vehicle;
        if (licensePlate) updateData['collectorData.licensePlate'] = licensePlate;
        if (capacity) updateData['collectorData.capacity'] = capacity;
        if (phone) updateData.phone = phone;

        const collector = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                collector: {
                    name: collector.name,
                    email: collector.email,
                    phone: collector.phone,
                    vehicle: collector.collectorData.vehicle,
                    licensePlate: collector.collectorData.licensePlate,
                    capacity: collector.collectorData.capacity
                }
            }
        });

    } catch (error) {
        console.error('Error updating collector profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile: ' + error.message
        });
    }
});

module.exports = router;