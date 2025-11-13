const express = require('express');
const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');
const Reward = require('../models/Reward');
const Redemption = require('../models/Redemption');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

// All routes in this file require admin access
router.use(protect);
router.use(requireAdmin);

// @desc    Get system overview analytics
// @route   GET /api/analytics/overview
// @access  Private/Admin
router.get('/overview', async (req, res) => {
    try {
        // Admin guard handled by middleware

        // Get basic counts
        const totalUsers = await User.countDocuments({ role: 'resident' });
        const totalCollectors = await User.countDocuments({ role: 'collector' });
        const totalPickups = await PickupRequest.countDocuments();
        const totalRewards = await Reward.countDocuments();
        const totalRedemptions = await Redemption.countDocuments();

        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayPickups = await PickupRequest.countDocuments({
            'tracking.completed': { $gte: today }
        });
        
        const todayRegistrations = await User.countDocuments({
            createdAt: { $gte: today }
        });

        // Get pickup status distribution
        const pickupStatus = await PickupRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get user tier distribution
        const userTiers = await User.aggregate([
            { $match: { role: 'resident' } },
            {
                $group: {
                    _id: '$tier',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get waste type distribution
        const wasteTypes = await PickupRequest.aggregate([
            {
                $group: {
                    _id: '$wasteType',
                    count: { $sum: 1 },
                    totalPoints: { $sum: '$estimatedPoints' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalCollectors,
                    totalPickups,
                    totalRewards,
                    totalRedemptions,
                    todayPickups,
                    todayRegistrations
                },
                distributions: {
                    pickupStatus,
                    userTiers,
                    wasteTypes
                }
            }
        });

    } catch (error) {
        console.error('Error fetching overview analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics: ' + error.message
        });
    }
});

// @desc    Get pickup trends over time
// @route   GET /api/analytics/pickup-trends
// @access  Private/Admin
router.get('/pickup-trends', async (req, res) => {
    try {
        // Admin guard handled by middleware

        const { period = '7d' } = req.query; // 7d, 30d, 90d
        
        let days;
        switch (period) {
            case '30d':
                days = 30;
                break;
            case '90d':
                days = 90;
                break;
            default:
                days = 7;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const pickupTrends = await PickupRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    },
                    totalPoints: { $sum: '$estimatedPoints' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                period,
                trends: pickupTrends
            }
        });

    } catch (error) {
        console.error('Error fetching pickup trends:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pickup trends: ' + error.message
        });
    }
});

// @desc    Get user growth analytics
// @route   GET /api/analytics/user-growth
// @access  Private/Admin
router.get('/user-growth', async (req, res) => {
    try {
        // Admin guard handled by middleware

        const { period = '30d' } = req.query;
        
        let days;
        switch (period) {
            case '7d':
                days = 7;
                break;
            case '90d':
                days = 90;
                break;
            case '1y':
                days = 365;
                break;
            default:
                days = 30;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    role: 'resident'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    newUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Calculate cumulative growth
        let cumulative = 0;
        const cumulativeGrowth = userGrowth.map(day => {
            cumulative += day.newUsers;
            return {
                date: day._id,
                newUsers: day.newUsers,
                activeUsers: day.activeUsers,
                cumulativeUsers: cumulative
            };
        });

        res.json({
            success: true,
            data: {
                period,
                growth: cumulativeGrowth
            }
        });

    } catch (error) {
        console.error('Error fetching user growth:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user growth: ' + error.message
        });
    }
});

// @desc    Get collector performance analytics
// @route   GET /api/analytics/collector-performance
// @access  Private/Admin
router.get('/collector-performance', async (req, res) => {
    try {
        // Admin guard handled by middleware

        const topCollectors = await User.aggregate([
            { $match: { role: 'collector' } },
            {
                $project: {
                    name: 1,
                    email: 1,
                    'collectorData.stats.completedPickups': 1,
                    'collectorData.stats.totalWasteCollected': 1,
                    'collectorData.stats.averageRating': 1,
                    'collectorData.stats.onTimeRate': 1,
                    'collectorData.isAvailable': 1
                }
            },
            { $sort: { 'collectorData.stats.completedPickups': -1 } },
            { $limit: 10 }
        ]);

        const performanceStats = await User.aggregate([
            { $match: { role: 'collector' } },
            {
                $group: {
                    _id: null,
                    totalCollectors: { $sum: 1 },
                    activeCollectors: {
                        $sum: {
                            $cond: [{ $eq: ['$collectorData.isAvailable', true] }, 1, 0]
                        }
                    },
                    avgCompletedPickups: { $avg: '$collectorData.stats.completedPickups' },
                    avgRating: { $avg: '$collectorData.stats.averageRating' },
                    avgOnTimeRate: { $avg: '$collectorData.stats.onTimeRate' },
                    totalWasteCollected: { $sum: '$collectorData.stats.totalWasteCollected' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                topCollectors,
                performanceStats: performanceStats[0] || {}
            }
        });

    } catch (error) {
        console.error('Error fetching collector performance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collector performance: ' + error.message
        });
    }
});

// @desc    Get rewards and points analytics
// @route   GET /api/analytics/rewards-analytics
// @access  Private/Admin
router.get('/rewards-analytics', async (req, res) => {
    try {
        // Admin guard handled by middleware

        // Reward statistics
        const rewardStats = await Reward.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    totalRedemptions: { $sum: '$redemptionCount' },
                    avgPoints: { $avg: '$points' }
                }
            }
        ]);

        // Points distribution
        const pointsDistribution = await User.aggregate([
            { $match: { role: 'resident' } },
            {
                $bucket: {
                    groupBy: '$points',
                    boundaries: [0, 100, 500, 1000, 1500, 5000],
                    default: '5000+',
                    output: {
                        count: { $sum: 1 },
                        avgPoints: { $avg: '$points' }
                    }
                }
            }
        ]);

        // Redemption trends
        const redemptionTrends = await Redemption.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    redemptions: { $sum: 1 },
                    pointsRedeemed: { $sum: '$points' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Most popular rewards
        const popularRewards = await Reward.find()
            .sort({ redemptionCount: -1 })
            .limit(10)
            .select('name category points stock redemptionCount');

        res.json({
            success: true,
            data: {
                rewardStats,
                pointsDistribution,
                redemptionTrends,
                popularRewards
            }
        });

    } catch (error) {
        console.error('Error fetching rewards analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rewards analytics: ' + error.message
        });
    }
});

// @desc    Get geographic heatmap data
// @route   GET /api/analytics/heatmap
// @access  Private/Admin
router.get('/heatmap', async (req, res) => {
    try {
        // Admin guard handled by middleware

        const heatmapData = await PickupRequest.aggregate([
            {
                $match: {
                    'location.coordinates': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        lat: { $arrayElemAt: ['$location.coordinates', 1] },
                        lng: { $arrayElemAt: ['$location.coordinates', 0] }
                    },
                    count: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    location: '$_id',
                    count: 1,
                    completed: 1,
                    completionRate: {
                        $cond: [
                            { $eq: ['$count', 0] },
                            0,
                            { $divide: ['$completed', '$count'] }
                        ]
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 100 }
        ]);

        res.json({
            success: true,
            data: heatmapData
        });

    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching heatmap data: ' + error.message
        });
    }
});

module.exports = router;