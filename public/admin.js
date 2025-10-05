const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalCollectors,
            totalPickups,
            pendingPickups,
            completedThisWeek,
            totalPoints
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'collector' }),
            PickupRequest.countDocuments(),
            PickupRequest.countDocuments({ status: 'pending' }),
            PickupRequest.countDocuments({ 
                status: 'completed',
                completedDate: { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
            }),
            User.aggregate([
                { $group: { _id: null, totalPoints: { $sum: '$points' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                users: { total: totalUsers, collectors: totalCollectors },
                pickups: { total: totalPickups, pending: pendingPickups, completedThisWeek },
                points: { total: totalPoints[0]?.totalPoints || 0 },
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    environment: process.env.NODE_ENV
                }
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system statistics'
        });
    }
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// @desc    Get all pickup requests with filters
// @route   GET /api/admin/pickups
// @access  Private/Admin
router.get('/pickups', async (req, res) => {
    try {
        const { status, wasteType, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (wasteType) filter.wasteType = wasteType;
        if (startDate || endDate) {
            filter.scheduledDate = {};
            if (startDate) filter.scheduledDate.$gte = new Date(startDate);
            if (endDate) filter.scheduledDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const pickups = await PickupRequest.find(filter)
            .populate('user', 'name email')
            .populate('collector', 'name email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ scheduledDate: -1 });

        const total = await PickupRequest.countDocuments(filter);

        res.json({
            success: true,
            data: pickups,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pickups'
        });
    }
});

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status'
        });
    }
});

// @desc    Update pickup status (admin override)
// @route   PUT /api/admin/pickups/:id/status
// @access  Private/Admin
router.put('/pickups/:id/status', async (req, res) => {
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
            pickup.statusHistory.push({
                status,
                changedAt: new Date(),
                changedBy: req.user.id,
                notes
            });
        }

        await pickup.save();

        res.json({
            success: true,
            message: 'Pickup status updated successfully',
            data: pickup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating pickup status'
        });
    }
});

module.exports = router;