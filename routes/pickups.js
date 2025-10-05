const mongoose = require('mongoose');

const statusOptions = ['pending', 'accepted', 'completed', 'cancelled', 'rejected'];

const pickupRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },
    collector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    wasteType: {
        type: String,
        required: [true, 'Waste type is required'],
        enum: {
            values: ['plastic', 'glass', 'paper', 'metal', 'electronic', 'organic', 'general'],
            message: 'Waste type must be plastic, glass, paper, metal, electronic, organic, or general'
        },
        index: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        trim: true
    },
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
            index: '2dsphere',
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
    images: [{
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
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
    completedDate: {
        type: Date
    },
    status: {
        type: String,
        enum: statusOptions,
        default: 'pending',
        index: true
    },
    statusHistory: [{
        status: { type: String, enum: statusOptions },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: String
    }],
    pointsAwarded: {
        type: Number,
        default: 0,
        min: [0, 'Points cannot be negative']
    },
    weight: {
        value: { type: Number, min: 0 },
        unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    rating: {
        score: { type: Number, min: 1, max: 5 },
        comment: String,
        ratedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for performance
pickupRequestSchema.index({ status: 1, scheduledDate: 1 });
pickupRequestSchema.index({ user: 1, createdAt: -1 });
pickupRequestSchema.index({ collector: 1, status: 1 });

// Virtual for duration until pickup
pickupRequestSchema.virtual('daysUntilPickup').get(function() {
    return Math.ceil((this.scheduledDate - new Date()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to track status changes
pickupRequestSchema.pre('save', function(next) {
    if (this.isModified('status') && this.statusHistory) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date(),
            changedBy: this.collector || this.user
        });
    }
    next();
});

// Static method to find pending pickups
pickupRequestSchema.statics.findPending = function() {
    return this.find({ status: 'pending' })
        .populate('user', 'name email profile.phone')
        .sort({ scheduledDate: 1, priority: -1 });
};

// Instance method to calculate points based on waste type and weight
pickupRequestSchema.methods.calculatePoints = function() {
    const pointsMap = {
        'plastic': 15,
        'glass': 20,
        'paper': 10,
        'metal': 25,
        'electronic': 50,
        'organic': 5,
        'general': 8
    };
    
    let points = pointsMap[this.wasteType] || 10;
    
    // Adjust points based on weight if available
    if (this.weight && this.weight.value) {
        points += Math.floor(this.weight.value * 0.5); // 0.5 points per kg
    }
    
    return Math.max(points, 5); // Minimum 5 points
};

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);