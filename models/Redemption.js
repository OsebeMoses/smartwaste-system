const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },
    rewardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward',
        required: [true, 'Reward reference is required'],
        index: true
    },
    points: {
        type: Number,
        required: [true, 'Points cost is required'],
        min: [1, 'Points must be at least 1']
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'cancelled', 'failed'],
        default: 'pending',
        index: true
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who processed the redemption
    },
    redemptionCode: {
        type: String,
        unique: true,
        sparse: true
    },
    userTierAtRedemption: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        required: true
    },
    metadata: {
        userNotes: String,
        adminNotes: String,
        deliveryInfo: {
            method: String,
            address: String,
            trackingNumber: String
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes
redemptionSchema.index({ userId: 1, status: 1 });
redemptionSchema.index({ rewardId: 1, createdAt: -1 });
redemptionSchema.index({ status: 1, createdAt: -1 });

// Virtual for redemption age in days
redemptionSchema.virtual('ageInDays').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for isProcessable
redemptionSchema.virtual('isProcessable').get(function() {
    return this.status === 'pending';
});

// Static method to find user's redemption history
redemptionSchema.statics.findByUser = function(userId, limit = 10) {
    return this.find({ userId })
        .populate('rewardId', 'name description category image')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to find pending redemptions for admin
redemptionSchema.statics.findPending = function() {
    return this.find({ status: 'pending' })
        .populate('userId', 'name email tier')
        .populate('rewardId', 'name points category')
        .sort({ createdAt: 1 });
};

// Static method to get redemption statistics
redemptionSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalPoints: { $sum: '$points' }
            }
        }
    ]);
    
    const total = await this.countDocuments();
    const totalPoints = await this.aggregate([
        { $match: { status: 'processed' } },
        { $group: { _id: null, total: { $sum: '$points' } } }
    ]);
    
    return {
        byStatus: stats,
        totalRedemptions: total,
        totalPointsProcessed: totalPoints[0]?.total || 0
    };
};

// Instance method to process redemption
redemptionSchema.methods.process = async function(adminId, notes = '') {
    if (this.status !== 'pending') {
        throw new Error('Redemption is not pending');
    }
    
    this.status = 'processed';
    this.processedAt = new Date();
    this.processedBy = adminId;
    this.metadata.adminNotes = notes;
    
    // Generate redemption code for digital rewards
    if (!this.redemptionCode) {
        this.redemptionCode = `SW${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    }
    
    await this.save();
    return this;
};

// Instance method to cancel redemption
redemptionSchema.methods.cancel = async function(reason = '') {
    if (this.status !== 'pending') {
        throw new Error('Only pending redemptions can be cancelled');
    }
    
    this.status = 'cancelled';
    this.metadata.adminNotes = reason;
    await this.save();
    return this;
};

// Pre-save middleware to validate redemption
redemptionSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'processed' && !this.processedAt) {
        this.processedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Redemption', redemptionSchema);