const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    // POINTS SYSTEM CONFIGURATION
    pointsSystem: {
        plastic: { 
            small: { type: Number, default: 30 },
            medium: { type: Number, default: 45 },
            large: { type: Number, default: 65 }
        },
        glass: { 
            small: { type: Number, default: 25 },
            medium: { type: Number, default: 40 },
            large: { type: Number, default: 60 }
        },
        paper: { 
            small: { type: Number, default: 20 },
            medium: { type: Number, default: 30 },
            large: { type: Number, default: 45 }
        },
        metal: { 
            small: { type: Number, default: 35 },
            medium: { type: Number, default: 50 },
            large: { type: Number, default: 70 }
        },
        electronic: { 
            small: { type: Number, default: 50 },
            medium: { type: Number, default: 75 },
            large: { type: Number, default: 100 }
        },
        organic: { 
            small: { type: Number, default: 15 },
            medium: { type: Number, default: 25 },
            large: { type: Number, default: 35 }
        },
        general: { 
            small: { type: Number, default: 10 },
            medium: { type: Number, default: 15 },
            large: { type: Number, default: 25 }
        }
    },
    
    // URGENCY MULTIPLIERS
    urgencyMultipliers: {
        low: { type: Number, default: 1.0 },
        medium: { type: Number, default: 1.2 },
        high: { type: Number, default: 1.5 }
    },
    
    // TIER THRESHOLDS
    tierThresholds: {
        bronze: { type: Number, default: 0 },
        silver: { type: Number, default: 500 },
        gold: { type: Number, default: 1500 }
    },
    
    // SYSTEM SETTINGS
    systemSettings: {
        autoAssignCollectors: { type: Boolean, default: false },
        maxPickupsPerCollector: { type: Number, default: 5 },
        pickupTimeWindow: { type: Number, default: 60 }, // minutes
        ratingRequired: { type: Boolean, default: true },
        pointsExpiry: { type: Number, default: 365 }, // days
        notificationSettings: {
            emailNotifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: false },
            pushNotifications: { type: Boolean, default: true }
        }
    },
    
    // COLLECTOR SETTINGS
    collectorSettings: {
        maxDistance: { type: Number, default: 10 }, // km
        minRating: { type: Number, default: 3.0 },
        availabilityRequired: { type: Boolean, default: true },
        paymentSettings: {
            baseRate: { type: Number, default: 50 }, // base payment per pickup
            distanceBonus: { type: Number, default: 5 }, // per km
            weightBonus: { type: Number, default: 2 } // per kg
        }
    },
    
    // REWARDS SETTINGS
    rewardsSettings: {
        autoApproveRedemptions: { type: Boolean, default: false },
        maxRedemptionsPerUser: { type: Number, default: 5 },
        redemptionProcessingTime: { type: Number, default: 24 }, // hours
        lowStockThreshold: { type: Number, default: 10 }
    },
    
    // MAINTENANCE MODE
    maintenance: {
        enabled: { type: Boolean, default: false },
        message: String,
        scheduledEnd: Date
    },
    
    // VERSIONING
    version: {
        type: String,
        default: '1.0.0'
    },
    
    // AUDIT TRAIL
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure only one configuration document exists
systemConfigSchema.statics.getConfig = async function() {
    let config = await this.findOne();
    if (!config) {
        // Create default configuration if none exists
        config = await this.create({});
    }
    return config;
};

// Method to update points for a specific waste type and size
systemConfigSchema.methods.updatePoints = function(wasteType, size, points) {
    if (!this.pointsSystem[wasteType]) {
        throw new Error(`Invalid waste type: ${wasteType}`);
    }
    if (!this.pointsSystem[wasteType][size]) {
        throw new Error(`Invalid size: ${size} for waste type: ${wasteType}`);
    }
    
    this.pointsSystem[wasteType][size] = points;
    return this.save();
};

// Method to calculate points for a pickup
systemConfigSchema.methods.calculatePoints = function(wasteType, wasteSize, urgency) {
    const basePoints = this.pointsSystem[wasteType]?.[wasteSize];
    const multiplier = this.urgencyMultipliers[urgency];
    
    if (!basePoints || !multiplier) {
        throw new Error('Invalid waste type, size, or urgency');
    }
    
    return Math.round(basePoints * multiplier);
};

// Method to get tier for a given points amount
systemConfigSchema.methods.getTier = function(points) {
    if (points >= this.tierThresholds.gold) {
        return 'gold';
    } else if (points >= this.tierThresholds.silver) {
        return 'silver';
    } else {
        return 'bronze';
    }
};

// Method to check if user can upgrade tier
systemConfigSchema.methods.canUpgradeTier = function(currentTier, currentPoints) {
    const nextTier = currentTier === 'bronze' ? 'silver' : currentTier === 'silver' ? 'gold' : null;
    if (!nextTier) return { canUpgrade: false, nextTier: null };
    
    const requiredPoints = this.tierThresholds[nextTier];
    return {
        canUpgrade: currentPoints >= requiredPoints,
        nextTier,
        requiredPoints,
        pointsNeeded: requiredPoints - currentPoints
    };
};

// Static method to get specific configuration value
systemConfigSchema.statics.getValue = async function(path) {
    const config = await this.getConfig();
    return path.split('.').reduce((obj, key) => obj?.[key], config);
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);