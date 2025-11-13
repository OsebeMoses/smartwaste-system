const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const Redemption = require('../models/Redemption');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { protect } = require('../middleware/auth');
const { requireResident, requireAdmin } = require('../middleware/roleAuth');
const paymentProvider = require('../services/paymentProvider');

// @desc    Get all available rewards for the current user
// @route   GET /api/rewards
// @access  Private (Resident only)
router.get('/', protect, requireResident, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const rewards = await Reward.findAvailableRewards(user.points, user.tier);

        res.json({
            success: true,
            data: rewards,
            meta: {
                userPoints: user.points,
                userTier: user.tier,
                totalAvailable: rewards.length
            }
        });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rewards: ' + error.message
        });
    }
});

// @desc    Get user's current points and rewards info
// @route   GET /api/rewards/my-points
// @access  Private (Resident only)
router.get('/my-points', protect, requireResident, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const systemConfig = await SystemConfig.getConfig();
        
        const tierInfo = systemConfig.canUpgradeTier(user.tier, user.points);

        res.json({
            success: true,
            data: {
                points: user.points,
                tier: user.tier,
                tierInfo: {
                    currentTier: user.tier,
                    canUpgrade: tierInfo.canUpgrade,
                    nextTier: tierInfo.nextTier,
                    pointsNeeded: tierInfo.pointsNeeded,
                    requiredPoints: tierInfo.requiredPoints
                },
                rewardsEligible: await Reward.countDocuments({
                    status: 'active',
                    stock: { $gt: 0 },
                    points: { $lte: user.points },
                    'requirements.minTier': { $lte: user.tier }
                })
            }
        });
    } catch (error) {
        console.error('Error fetching user points:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching points information: ' + error.message
        });
    }
});

// @desc    Get rewards by category
// @route   GET /api/rewards/category/:category
// @access  Private (Resident only)
router.get('/category/:category', protect, requireResident, async (req, res) => {
    try {
        const { category } = req.params;
        const user = await User.findById(req.user.id);
        
        const rewards = await Reward.findByCategory(category);

        res.json({
            success: true,
            data: rewards,
            meta: {
                category,
                userPoints: user.points,
                userTier: user.tier
            }
        });
    } catch (error) {
        console.error('Error fetching rewards by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rewards: ' + error.message
        });
    }
});

// @desc    Redeem points for a reward
// @route   POST /api/rewards/redeem
// @access  Private (Resident only)
router.post('/redeem', protect, requireResident, async (req, res) => {
    try {
        const { rewardId } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!rewardId) {
            return res.status(400).json({
                success: false,
                message: 'Reward ID is required'
            });
        }

        // Get user and reward
        const user = await User.findById(userId);
        const reward = await Reward.findById(rewardId);

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Reward not found'
            });
        }

        // Check if user can redeem this reward
        const userRedemptionCount = await Redemption.countDocuments({
            userId,
            rewardId,
            status: 'processed'
        });

        const canRedeem = reward.canUserRedeem(
            user.points, 
            user.tier, 
            userRedemptionCount
        );

        if (!canRedeem.canRedeem) {
            return res.status(400).json({
                success: false,
                message: `Cannot redeem reward: ${canRedeem.reason}`
            });
        }

        // Create redemption record
        const redemption = await Redemption.create({
            userId,
            rewardId,
            points: reward.points,
            userTierAtRedemption: user.tier,
            status: 'pending'
        });

        // Deduct points from user
        user.points -= reward.points;
        await user.save();

        // Update reward stock and redemption count
        await Reward.updateStock(rewardId, -1);
        reward.redemptionCount += 1;
        await reward.save();

        // Optional: call external provider
        const providerCfg = paymentProvider.getConfig();
        if (providerCfg) {
            const result = await paymentProvider.redeem({ userId, reward, user });
            if (!result.success) {
                // Refund and mark failed
                await User.findByIdAndUpdate(userId, { $inc: { points: reward.points } });
                await Reward.updateStock(rewardId, 1);
                redemption.status = 'failed';
                await redemption.save();
                return res.status(502).json({
                    success: false,
                    message: `Redemption provider error: ${result.code}`
                });
            }
            // Attach external reference if provided
            if (result.data?.reference || result.data?.code) {
                redemption.redemptionCode = result.data.reference || result.data.code;
            }
        }

        // Auto-process if enabled in system config
        const systemConfig = await SystemConfig.getConfig();
        if (systemConfig.rewardsSettings.autoApproveRedemptions) {
            await redemption.process(req.user.id, providerCfg ? 'Processed via external provider' : 'Auto-approved by system');
        }

        await redemption.populate('rewardId', 'name description category points');

        res.json({
            success: true,
            message: 'Reward redemption request submitted successfully',
            data: {
                redemption,
                newPointsBalance: user.points,
                reward: redemption.rewardId
            }
        });

    } catch (error) {
        console.error('Error redeeming reward:', error);
        res.status(500).json({
            success: false,
            message: 'Error redeeming reward: ' + error.message
        });
    }
});

// @desc    Get user's redemption history
// @route   GET /api/rewards/my-redemptions
// @access  Private (Resident only)
router.get('/my-redemptions', protect, requireResident, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const redemptions = await Redemption.findByUser(req.user.id, parseInt(limit));

        res.json({
            success: true,
            data: redemptions
        });
    } catch (error) {
        console.error('Error fetching redemption history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching redemption history: ' + error.message
        });
    }
});

// @desc    Get specific redemption details
// @route   GET /api/rewards/redemptions/:id
// @access  Private
router.get('/redemptions/:id', protect, async (req, res) => {
    try {
        const redemption = await Redemption.findById(req.params.id)
            .populate('rewardId')
            .populate('processedBy', 'name email');

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        // Check authorization - user can only see their own redemptions
        if (redemption.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this redemption'
            });
        }

        res.json({
            success: true,
            data: redemption
        });
    } catch (error) {
        console.error('Error fetching redemption details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching redemption details: ' + error.message
        });
    }
});

// ================= ADMIN ROUTES ================= //

// @desc    Get all rewards (Admin)
// @route   GET /api/rewards/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, requireAdmin, async (req, res) => {
    try {
        const rewards = await Reward.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: rewards
        });
    } catch (error) {
        console.error('Error fetching all rewards:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rewards: ' + error.message
        });
    }
});

// @desc    Create a new reward (Admin)
// @route   POST /api/rewards/admin/create
// @access  Private/Admin
router.post('/admin/create', protect, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            points,
            category,
            image,
            stock,
            minTier,
            maxRedemptionsPerUser
        } = req.body;

        const reward = await Reward.create({
            name,
            description,
            points,
            category,
            image,
            stock,
            requirements: {
                minTier: minTier || 'bronze',
                maxRedemptionsPerUser: maxRedemptionsPerUser || 1
            }
        });

        res.status(201).json({
            success: true,
            message: 'Reward created successfully',
            data: reward
        });
    } catch (error) {
        console.error('Error creating reward:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating reward: ' + error.message
        });
    }
});

// @desc    Update a reward (Admin)
// @route   PUT /api/rewards/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, requireAdmin, async (req, res) => {
    try {
        const reward = await Reward.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Reward not found'
            });
        }

        res.json({
            success: true,
            message: 'Reward updated successfully',
            data: reward
        });
    } catch (error) {
        console.error('Error updating reward:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating reward: ' + error.message
        });
    }
});

// @desc    Get all redemptions (Admin)
// @route   GET /api/rewards/admin/redemptions
// @access  Private/Admin
router.get('/admin/redemptions', protect, requireAdmin, async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        let query = {};
        
        if (status) {
            query.status = status;
        }

        const redemptions = await Redemption.find(query)
            .populate('userId', 'name email tier')
            .populate('rewardId', 'name points category')
            .populate('processedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const stats = await Redemption.getStats();

        res.json({
            success: true,
            data: redemptions,
            meta: {
                stats,
                total: redemptions.length
            }
        });
    } catch (error) {
        console.error('Error fetching redemptions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching redemptions: ' + error.message
        });
    }
});

// @desc    Process a redemption (Admin)
// @route   PATCH /api/rewards/admin/redemptions/:id/process
// @access  Private/Admin
router.patch('/admin/redemptions/:id/process', protect, requireAdmin, async (req, res) => {
    try {
        const { notes } = req.body;
        const redemption = await Redemption.findById(req.params.id);

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        await redemption.process(req.user.id, notes);

        res.json({
            success: true,
            message: 'Redemption processed successfully',
            data: redemption
        });
    } catch (error) {
        console.error('Error processing redemption:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing redemption: ' + error.message
        });
    }
});

// @desc    Cancel a redemption (Admin)
// @route   PATCH /api/rewards/admin/redemptions/:id/cancel
// @access  Private/Admin
router.patch('/admin/redemptions/:id/cancel', protect, requireAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        const redemption = await Redemption.findById(req.params.id);

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        // Refund points to user if redemption was pending
        if (redemption.status === 'pending') {
            await User.findByIdAndUpdate(redemption.userId, {
                $inc: { points: redemption.points }
            });
            
            // Restore reward stock
            await Reward.updateStock(redemption.rewardId, 1);
        }

        await redemption.cancel(reason);

        res.json({
            success: true,
            message: 'Redemption cancelled successfully',
            data: redemption
        });
    } catch (error) {
        console.error('Error cancelling redemption:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling redemption: ' + error.message
        });
    }
});

module.exports = router;