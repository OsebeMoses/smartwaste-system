const mongoose = require('mongoose');

// Define the status options
const statusOptions = ['pending', 'accepted', 'completed', 'cancelled'];

const pickupRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    wasteType: {
      type: String,
      required: [true, 'Please add a waste type'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    // location field
    location: {
      type: {
        type: String, // GeoJSON requires "type"
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    imageUrl: {
      type: String,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: statusOptions,
      default: 'pending',
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

//  Geo index for queries like $near, $geoWithin
pickupRequestSchema.index({ location: '2dsphere' });

//  Prevent OverwriteModelError on Nodemon restarts
module.exports =
  mongoose.models.PickupRequest ||
  mongoose.model('PickupRequest', pickupRequestSchema);
