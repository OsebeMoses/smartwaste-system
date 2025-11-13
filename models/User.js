const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['resident', 'collector', 'admin'],
    default: 'resident'
  },
  
  // COMMON FIELDS FOR ALL USERS
  profile: {
    address: String,
    avatar: String
  },
  points: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    default: 'bronze'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pickupReminders: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: false },
    rewardsUpdates: { type: Boolean, default: true }
  },
  
  // RESIDENT-SPECIFIC FIELDS
  residentData: {
    totalPickups: { type: Number, default: 0 },
    wasteRecycled: { type: Number, default: 0 }, // in kg
    location: {
      address: String,
      coordinates: {
        lat: { type: Number, default: -1.2921 }, // Default Nairobi coordinates
        lng: { type: Number, default: 36.8219 }
      }
    },
    memberSince: { type: Date, default: Date.now }
  },
  
  // COLLECTOR-SPECIFIC FIELDS
  collectorData: {
    vehicle: {
      type: String,
      enum: ['truck', 'van', 'car', 'bike', 'other'],
      default: 'car'
    },
    licensePlate: String,
    capacity: { type: Number, default: 100 }, // kg capacity
    isAvailable: { type: Boolean, default: true },
    stats: {
      completedPickups: { type: Number, default: 0 },
      totalWasteCollected: { type: Number, default: 0 }, // kg
      averageRating: { type: Number, default: 0 },
      onTimeRate: { type: Number, default: 0 }, // percentage
      totalEarnings: { type: Number, default: 0 }
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date
    },
    assignedPickups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupRequest'
    }]
  },
  
  // ADMIN-SPECIFIC FIELDS
  adminData: {
    permissions: {
      userManagement: { type: Boolean, default: true },
      systemConfig: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      reports: { type: Boolean, default: true }
    },
    lastLogin: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Virtual for formatted address
userSchema.virtual('formattedAddress').get(function() {
  if (this.role === 'resident' && this.residentData.location.address) {
    return this.residentData.location.address;
  }
  return 'Address not specified';
});

// Method to check if user can redeem reward
userSchema.methods.canRedeemReward = function(rewardPoints) {
  return this.points >= rewardPoints;
};

// Method to update user tier based on points
userSchema.methods.updateTier = function() {
  if (this.points >= 1500) {
    this.tier = 'gold';
  } else if (this.points >= 500) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
};

// Static method to find available collectors
userSchema.statics.findAvailableCollectors = function() {
  return this.find({
    role: 'collector',
    status: 'active',
    'collectorData.isAvailable': true
  });
};

// Static method to find nearby collectors
userSchema.statics.findNearbyCollectors = function(lat, lng, maxDistance = 10) {
  return this.find({
    role: 'collector',
    status: 'active',
    'collectorData.isAvailable': true,
    'collectorData.currentLocation': {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });
};

// Index for geospatial queries
userSchema.index({ 'collectorData.currentLocation': '2dsphere' });
userSchema.index({ 'residentData.location.coordinates': '2dsphere' });

module.exports = mongoose.model('User', userSchema);