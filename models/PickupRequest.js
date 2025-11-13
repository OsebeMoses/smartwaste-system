const mongoose = require('mongoose');

// Define the status options - UPDATED to match our business logic
const statusOptions = ['pending', 'accepted', 'inProgress', 'completed', 'cancelled'];

const pickupRequestSchema = new mongoose.Schema({
    // RELATIONSHIPS
    residentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Resident reference is required'],
        index: true
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    
    // WASTE INFORMATION
    wasteType: {
        type: String,
        required: [true, 'Waste type is required'],
        enum: {
            values: ['plastic', 'glass', 'paper', 'metal', 'electronic', 'organic', 'general'],
            message: 'Waste type must be plastic, glass, paper, metal, electronic, organic, or general'
        },
        index: true
    },
    wasteSize: {
        type: String,
        required: [true, 'Waste size is required'],
        enum: ['small', 'medium', 'large'],
        default: 'medium'
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        trim: true
    },
    
    // LOCATION DETAILS
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function(coords) {
                    return coords.length === 2 && 
                           coords[0] >= -180 && coords[0] <= 180 && 
                           coords[1] >= -90 && coords[1] <= 90;
                },
                message: 'Invalid coordinates format'
            }
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true
        },
        instructions: {
            type: String,
            maxlength: 200,
            trim: true
        }
    },
    
    // SCHEDULING
    scheduledDate: {
        type: Date,
        required: [true, 'Scheduled date is required'],
        validate: {
            validator: function(date) {
                return date > new Date();
            },
            message: 'Scheduled date must be in the future'
        },
        index: true
    },
    
    // URGENCY & PRIORITY
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    
    // STATUS & TRACKING
    status: {
        type: String,
        enum: statusOptions,
        default: 'pending',
        index: true
    },
    
    // COMPREHENSIVE TRACKING SYSTEM
    tracking: {
        requested: { type: Date, default: Date.now },
        accepted: Date,
        inProgress: Date,
        completed: Date,
        collectorLocation: [{
            lat: Number,
            lng: Number,
            timestamp: { type: Date, default: Date.now }
        }],
        estimatedArrival: Date,
        actualArrival: Date
    },
    
    // POINTS SYSTEM
    estimatedPoints: {
        type: Number,
        default: 0
    },
    actualPoints: {
        type: Number,
        default: 0
    },
    
    // WASTE MEASUREMENT
    estimatedWeight: {
        type: Number,
        min: 0
    },
    actualWeight: {
        type: Number,
        min: 0
    },
    
    // MEDIA
    photos: [{
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    
    // COMPLETION DATA
    completedDate: {
        type: Date
    },
    collectorNotes: {
        type: String,
        maxlength: 500
    },
    residentRating: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        ratedAt: Date
    },
    
    // STATUS HISTORY FOR AUDIT
    statusHistory: [{
        status: { type: String, enum: statusOptions },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for performance
pickupRequestSchema.index({ status: 1, scheduledDate: 1 });
pickupRequestSchema.index({ residentId: 1, createdAt: -1 });
pickupRequestSchema.index({ collectorId: 1, status: 1 });
pickupRequestSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for duration until pickup
pickupRequestSchema.virtual('daysUntilPickup').get(function() {
    return Math.ceil((this.scheduledDate - new Date()) / (1000 * 60 * 60 * 24));
});

// Virtual for isOverdue
pickupRequestSchema.virtual('isOverdue').get(function() {
    return this.status !== 'completed' && this.status !== 'cancelled' && this.scheduledDate < new Date();
});

// Virtual for formatted status
pickupRequestSchema.virtual('formattedStatus').get(function() {
    const statusMap = {
        'pending': 'Pending',
        'accepted': 'Accepted',
        'inProgress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[this.status] || this.status;
});

// Pre-save middleware to track status changes and update tracking timestamps
pickupRequestSchema.pre('save', function(next) {
    // Track status changes
    if (this.isModified('status') && this.statusHistory) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this.collectorId || this.residentId
        });
    }
    
    // Update tracking timestamps based on status changes
    if (this.isModified('status')) {
        const now = new Date();
        switch (this.status) {
            case 'accepted':
                this.tracking.accepted = now;
                break;
            case 'inProgress':
                this.tracking.inProgress = now;
                break;
            case 'completed':
                this.tracking.completed = now;
                this.completedDate = now;
                // Set actual points if not already set
                if (this.actualPoints === 0) {
                    this.actualPoints = this.estimatedPoints;
                }
                break;
        }
    }
    
    next();
});

// Static method to find pending pickups for collectors
pickupRequestSchema.statics.findAvailablePickups = function() {
    return this.find({ 
        status: 'pending',
        scheduledDate: { $gte: new Date() } // Only future scheduled pickups
    })
    .populate('residentId', 'name email phone residentData.location')
    .sort({ scheduledDate: 1, urgency: -1 });
};

// Static method to find pickups by resident
pickupRequestSchema.statics.findByResident = function(residentId) {
    return this.find({ residentId })
        .populate('collectorId', 'name email phone collectorData.vehicle')
        .sort({ createdAt: -1 });
};

// Static method to find active pickups by collector
pickupRequestSchema.statics.findByCollector = function(collectorId) {
    return this.find({ 
        collectorId,
        status: { $in: ['accepted', 'inProgress'] }
    })
    .populate('residentId', 'name email phone residentData.location.address')
    .sort({ scheduledDate: 1 });
};

// Static method to find nearby pending pickups
pickupRequestSchema.statics.findNearbyPickups = function(lat, lng, maxDistance = 10) {
    return this.find({
        status: 'pending',
        scheduledDate: { $gte: new Date() },
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: maxDistance * 1000 // Convert km to meters
            }
        }
    })
    .populate('residentId', 'name email phone')
    .sort({ urgency: -1, scheduledDate: 1 });
};

// Instance method to calculate estimated points based on waste type, size, and urgency
pickupRequestSchema.methods.calculateEstimatedPoints = function(pointsConfig, urgencyMultipliers) {
    const basePoints = pointsConfig[this.wasteType][this.wasteSize];
    const multiplier = urgencyMultipliers[this.urgency];
    return Math.round(basePoints * multiplier);
};

// Instance method to update collector location for real-time tracking
pickupRequestSchema.methods.updateCollectorLocation = function(lat, lng) {
    this.tracking.collectorLocation.push({
        lat,
        lng,
        timestamp: new Date()
    });
    
    // Keep only last 50 locations to prevent bloating
    if (this.tracking.collectorLocation.length > 50) {
        this.tracking.collectorLocation = this.tracking.collectorLocation.slice(-50);
    }
};

// Instance method to complete pickup with actual data
pickupRequestSchema.methods.completePickup = function(actualWeight, collectorNotes) {
    this.status = 'completed';
    this.actualWeight = actualWeight;
    this.collectorNotes = collectorNotes;
    this.tracking.completed = new Date();
    this.completedDate = new Date();
};

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);