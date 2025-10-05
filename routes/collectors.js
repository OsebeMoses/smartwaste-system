const express = require('express');
const { protect } = require('../middleware/auth');
const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// @desc    Get all pending pickup requests
// @route   GET /api/collector/pickups
// @access  Private (Collector only)
router.get('/pickups', async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Collector role required.' 
      });
    }

    const pickups = await PickupRequest.find({ status: 'pending' })
                                      .populate('user', 'name email')
                                      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pickups.length,
      data: pickups
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Accept a pickup request
// @route   PUT /api/collector/pickup/:id/accept
// @access  Private (Collector only)
router.put('/pickup/:id/accept', async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Collector role required.' 
      });
    }

    const pickup = await PickupRequest.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup request not found' 
      });
    }

    pickup.status = 'accepted';
    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Pickup request accepted',
      data: pickup
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Complete a pickup request and award points
// @route   PUT /api/collector/pickup/:id/complete
// @access  Private (Collector only)
router.put('/pickup/:id/complete', async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Collector role required.' 
      });
    }

    const pickup = await PickupRequest.findById(req.params.id).populate('user');

    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup request not found' 
      });
    }

    // Calculate points based on waste type
    const pointsMap = {
      'plastic': 10,
      'glass': 15,
      'paper': 8,
      'metal': 12,
      'general': 5
    };
    
    const pointsToAdd = pointsMap[pickup.wasteType.toLowerCase()] || 5;

    // Update pickup and user points
    pickup.status = 'completed';
    pickup.pointsAwarded = pointsToAdd;
    await pickup.save();

    pickup.user.points += pointsToAdd;
    await pickup.user.save();

    res.status(200).json({
      success: true,
      message: `Pickup completed! ${pointsToAdd} points awarded to user.`,
      data: pickup
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;