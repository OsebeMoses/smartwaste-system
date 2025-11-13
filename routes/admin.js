const express = require('express');
const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const Reward = require('../models/Reward');
const Redemption = require('../models/Redemption');

const SystemConfig = require('../models/SystemConfig');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

const router = express.Router();

// All routes in this file require admin access
router.use(protect);
router.use(requireAdmin);

// ================= USER MANAGEMENT ================= //

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            role, 
            status, 
            tier, 
            search 
        } = req.query;

        // Build filter object
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (tier) filter.tier = tier;
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users: ' + error.message
        });
    }
});

// PUT alias for assigning pickup (client compatibility)
router.put('/pickups/:id/assign', async (req, res) => {
    try {
        const { collectorId } = req.body;
        if (!collectorId) {
            return res.status(400).json({ success: false, message: 'collectorId is required' });
        }
        const pickup = await PickupRequest.findById(req.params.id);
        if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
        pickup.collectorId = collectorId;
        await pickup.save();
        res.json({ success: true, message: 'Pickup assigned successfully', data: pickup });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error assigning collector: ' + error.message });
    }
});

// @desc    Get user analytics/stats
// @route   GET /api/admin/users/stats
// @access  Private/Admin
router.get('/users/stats', async (req, res) => {
    try {
        const total = await User.countDocuments({ role: 'resident' });
        const active = await User.countDocuments({ role: 'resident', status: 'active' });
        const suspended = await User.countDocuments({ role: 'resident', status: 'suspended' });
        const tiers = await User.aggregate([
            { $match: { role: 'resident' } },
            { $group: { _id: '$tier', count: { $sum: 1 } } }
        ]);
        res.json({ success: true, data: { total, active, suspended, tiers } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user stats: ' + error.message });
    }
});

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's pickup history
        const pickups = await PickupRequest.find({ residentId: user._id })
            .populate('collectorId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get user's redemption history
        const redemptions = await Redemption.find({ userId: user._id })
            .populate('rewardId', 'name points')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                user,
                pickups,
                redemptions
            }
        });

    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details: ' + error.message
        });
    }
});

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                $set: {
                    'adminData.suspensionReason': reason || ''
                }
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User status updated to ${status}`,
            data: user
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user status: ' + error.message
        });
    }
});

// @desc    Update user points
// @route   PATCH /api/admin/users/:id/points
// @access  Private/Admin
router.patch('/users/:id/points', async (req, res) => {
    try {
        const { points, action, reason } = req.body; // action: 'add', 'subtract', 'set'

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let newPoints = user.points;
        switch (action) {
            case 'add':
                newPoints += points;
                break;
            case 'subtract':
                newPoints = Math.max(0, newPoints - points);
                break;
            case 'set':
                newPoints = points;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use: add, subtract, or set'
                });
        }

        user.points = newPoints;
        user.updateTier();
        await user.save();

        // Log the points adjustment
        // You might want to create an AuditLog model for this

        res.json({
            success: true,
            message: `Points ${action}ed successfully`,
            data: {
                previousPoints: user.points,
                newPoints,
                tier: user.tier,
                action,
                reason
            }
        });

    } catch (error) {
        console.error('Error updating user points:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user points: ' + error.message
        });
    }
});

// ================= PICKUP MANAGEMENT ================= //

// @desc    Get all pickups with filtering
// @route   GET /api/admin/pickups
// @access  Private/Admin
router.get('/pickups', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            wasteType, 
            dateFrom, 
            dateTo 
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (wasteType) filter.wasteType = wasteType;
        
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        const pickups = await PickupRequest.find(filter)
            .populate('residentId', 'name email')
            .populate('collectorId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PickupRequest.countDocuments(filter);

        res.json({
            success: true,
            data: pickups,
            meta: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching pickups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pickups: ' + error.message
        });
    }
});

// @desc    Update pickup status (admin override)
// @route   PATCH /api/admin/pickups/:id/status
// @access  Private/Admin
router.patch('/pickups/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;

        const pickup = await PickupRequest.findById(req.params.id);
        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        pickup.status = status;
        if (notes) {
            pickup.collectorNotes = notes;
        }

        await pickup.save();

        res.json({
            success: true,
            message: `Pickup status updated to ${status}`,
            data: pickup
        });

    } catch (error) {
        console.error('Error updating pickup status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating pickup status: ' + error.message
        });
    }
});

// @desc    Assign pickup to collector
// @route   PATCH /api/admin/pickups/:id/assign
// @access  Private/Admin
router.patch('/pickups/:id/assign', async (req, res) => {
    try {
        const { collectorId } = req.body;

        const pickup = await PickupRequest.findById(req.params.id);
        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: 'Pickup not found'
            });
        }

        pickup.collectorId = collectorId;
        await pickup.save();

        res.json({
            success: true,
            message: `Pickup assigned to collector ${collectorId}`,
            data: pickup
        });

    } catch (error) {
        console.error('Error assigning pickup to collector:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning pickup to collector: ' + error.message
        });
    }
});

// @desc    Get pickup statistics
// @route   GET /api/admin/pickups/stats
// @access  Private/Admin
router.get('/pickups/stats', async (req, res) => {
    try {
        const totalPickups = await PickupRequest.countDocuments();
        const completedPickups = await PickupRequest.countDocuments({ status: 'completed' });
        const pendingPickups = await PickupRequest.countDocuments({ status: 'pending' });

        res.json({
            success: true,
            data: {
                totalPickups,
                completedPickups,
                pendingPickups
            }
        });

    } catch (error) {
        console.error('Error fetching pickup statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pickup statistics: ' + error.message
        });
    }
});

// ================= COLLECTOR MANAGEMENT ================= //

// @desc    Get all collectors
// @route   GET /api/admin/collectors
// @access  Private/Admin
router.get('/collectors', async (req, res) => {
    try {
        const collectors = await User.find({ role: 'collector' })
            .select('-password')
            .sort({ 'collectorData.stats.completedPickups': -1 });

        res.json({
            success: true,
            data: collectors
        });

    } catch (error) {
        console.error('Error fetching collectors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collectors: ' + error.message
        });
    }
});

// @desc    Create collector
// @route   POST /api/admin/collectors
// @access  Private/Admin
router.post('/collectors', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const collector = await User.create({ name, email, password, role: 'collector' });

        res.json({
            success: true,
            message: 'Collector created successfully',
            data: collector
        });

    } catch (error) {
        console.error('Error creating collector:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating collector: ' + error.message
        });
    }
});

// @desc    Update collector status
// @route   PATCH /api/admin/collectors/:id/status
// @access  Private/Admin
router.patch('/collectors/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const collector = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select('-password');

        if (!collector) {
            return res.status(404).json({
                success: false,
                message: 'Collector not found'
            });
        }

        res.json({
            success: true,
            message: `Collector status updated to ${status}`,
            data: collector
        });

    } catch (error) {
        console.error('Error updating collector status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating collector status: ' + error.message
        });
    }
});

// ================= DASHBOARD STATS ================= //

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
    try {
        // Get basic counts
        const totalUsers = await User.countDocuments({ role: 'resident' });
        const totalCollectors = await User.countDocuments({ role: 'collector' });
        const totalPickups = await PickupRequest.countDocuments();
        const pendingPickups = await PickupRequest.countDocuments({ status: 'pending' });

        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStats = await PickupRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    todayPickups: { $sum: 1 },
                    todayCompleted: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    },
                    todayPoints: { $sum: '$estimatedPoints' }
                }
            }
        ]);

        // Get recent activities
        const recentPickups = await PickupRequest.find()
            .populate('residentId', 'name')
            .populate('collectorId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentUsers = await User.find({ role: 'resident' })
            .select('name email createdAt tier points')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalCollectors,
                    totalPickups,
                    pendingPickups,
                    todayStats: todayStats[0] || {
                        todayPickups: 0,
                        todayCompleted: 0,
                        todayPoints: 0
                    }
                },
                recentActivities: {
                    pickups: recentPickups,
                    users: recentUsers
                }
            }
        });

    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data: ' + error.message
        });
    }
});

module.exports = router;