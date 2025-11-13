const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Reward name is required'],
        trim: true,
        maxlength: [100, 'Reward name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Reward description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    points: {
        type: Number,
        required: [true, 'Points cost is required'],
        min: [1, 'Points cost must be at least 1']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['eco', 'digital', 'membership', 'voucher'],
            message: 'Category must be eco, digital, membership, or voucher'
        },
        index: true
    },
    image: {
        type: String,
        default: null
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active',
        index: true
    },
    redemptionCount: {
        type: Number,
        default: 0
    },
    requirements: {
        minTier: {
            type: String,
            enum: ['bronze', 'silver', 'gold'],
            default: 'bronze'
        },
        maxRedemptionsPerUser: {
            type: Number,
            default: 1
        }
    },
    metadata: {
        brand: String,
        validityPeriod: Number, // in days
        terms: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for better query performance
rewardSchema.index({ category: 1, status: 1 });
rewardSchema.index({ points: 1, status: 1 });
rewardSchema.index({ status: 1, stock: 1 });

// Virtual for available stock
rewardSchema.virtual('availableStock').get(function() {
    return this.stock;
});

// Virtual for isAvailable
rewardSchema.virtual('isAvailable').get(function() {
    return this.status === 'active' && this.stock > 0;
});

// Virtual for redemption rate
rewardSchema.virtual('redemptionRate').get(function() {
    if (this.redemptionCount === 0) return 0;
    return (this.redemptionCount / (this.redemptionCount + this.stock)) * 100;
});

// Static method to find available rewards for a user
rewardSchema.statics.findAvailableRewards = function(userPoints = 0, userTier = 'bronze') {
    return this.find({
        status: 'active',
        stock: { $gt: 0 },
        points: { $lte: userPoints },
        'requirements.minTier': { $lte: userTier } // Tier hierarchy: bronze < silver < gold
    }).sort({ points: 1, category: 1 });
};

// Static method to find rewards by category
rewardSchema.statics.findByCategory = function(category) {
    return this.find({
        category,
        status: 'active',
        stock: { $gt: 0 }
    }).sort({ points: 1 });
};

// Static method to update stock safely
rewardSchema.statics.updateStock = async function(rewardId, quantityChange) {
    const reward = await this.findById(rewardId);
    if (!reward) {
        throw new Error('Reward not found');
    }

    const newStock = reward.stock + quantityChange;
    if (newStock < 0) {
        throw new Error('Insufficient stock');
    }

    // Update stock and status
    reward.stock = newStock;
    if (newStock === 0) {
        reward.status = 'out_of_stock';
    } else if (reward.status === 'out_of_stock') {
        reward.status = 'active';
    }

    await reward.save();
    return reward;
};

// Instance method to check if user can redeem
rewardSchema.methods.canUserRedeem = function(userPoints, userTier, userRedemptionCount = 0) {
    // Check points
    if (userPoints < this.points) {
        return { canRedeem: false, reason: 'Insufficient points' };
    }

    // Check tier
    const tierHierarchy = { bronze: 1, silver: 2, gold: 3 };
    if (tierHierarchy[userTier] < tierHierarchy[this.requirements.minTier]) {
        return { canRedeem: false, reason: 'Tier requirement not met' };
    }

    // Check stock
    if (this.stock <= 0) {
        return { canRedeem: false, reason: 'Out of stock' };
    }

    // Check user redemption limit
    if (userRedemptionCount >= this.requirements.maxRedemptionsPerUser) {
        return { canRedeem: false, reason: 'Redemption limit reached' };
    }

    return { canRedeem: true, reason: '' };
};

// Pre-save middleware to update status based on stock
rewardSchema.pre('save', function(next) {
    if (this.isModified('stock') && this.stock === 0 && this.status === 'active') {
        this.status = 'out_of_stock';
    }
    next();
});

module.exports = mongoose.model('Reward', rewardSchema);