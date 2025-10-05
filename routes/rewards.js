const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @desc    Get user's current points and rewards
// @route   GET /api/rewards/my-points
// @access  Private
router.get('/my-points', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      points: user.points,
      message: `You have ${user.points} points available`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Redeem points for a reward
// @route   POST /api/rewards/redeem
// @access  Private
router.post('/redeem', protect, async (req, res) => {
  try {
    const { rewardType } = req.body; // e.g., 'airtime', 'voucher'
    const user = await User.findById(req.user.id);

    // Define reward costs
    const rewardCosts = {
      'airtime_100': 100,    // 100 points = 100 KSH airtime
      'airtime_500': 500,    // 500 points = 500 KSH airtime  
      'voucher_500': 800,    // 800 points = 500 KSH voucher
      'voucher_1000': 1500   // 1500 points = 1000 KSH voucher
    };

    if (!rewardCosts[rewardType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward type'
      });
    }

    const cost = rewardCosts[rewardType];

    if (user.points < cost) {
      return res.status(400).json({
        success: false, 
        message: `Not enough points. You need ${cost} points but have only ${user.points}`
      });
    }

    // Deduct points and save
    user.points -= cost;
    await user.save();

    // In a real system, you would integrate with an airtime API or voucher system here
    res.status(200).json({
      success: true,
      message: `Reward redeemed successfully! ${cost} points deducted.`,
      newBalance: user.points,
      rewardDetails: {
        type: rewardType,
        value: rewardType.includes('100') ? 100 : rewardType.includes('500') ? 500 : 1000
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;