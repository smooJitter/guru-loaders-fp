/**
 * Shared Address Schema
 * @module domain-models/lib/shared_schema/location/address
 * @see gcm-type-composers/location/address.modelTC.js
 */

import mongoose from 'mongoose';
import { addressValidators } from '../../validators/address.validators.js';

const { Schema } = mongoose;

// Coordinates sub-schema
const CoordinatesSchema = new Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
}, { _id: false });

// Main address schema
const AddressSchema = new Schema({
  street1: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  street2: {
    type: String,
    trim: true,
    maxlength: 100
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  state: {
    type: String,
    trim: true,
    maxlength: 50
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  coordinates: {
    type: CoordinatesSchema,
    index: '2dsphere'
  },
  type: {
    type: String,
    enum: ['residential', 'business', 'shipping', 'billing', 'venue'],
    default: 'residential'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, {
  _id: false,
  timestamps: false
});

// Add compound indexes
AddressSchema.index({ postalCode: 1, country: 1 });
AddressSchema.index({ city: 1, country: 1 });

// Add instance methods
AddressSchema.methods.toString = function() {
  const parts = [
    this.street1,
    this.street2,
    this.city,
    this.state,
    this.postalCode,
    this.country
  ].filter(Boolean);
  
  return parts.join(', ');
};

// Add static methods
AddressSchema.statics.findByCoordinates = function(lat, lng, maxDistance) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

// Virtuals
AddressSchema.virtual('fullAddress').get(function() {
  return this.toString();
});

// Export schemas
export {
  CoordinatesSchema,
  AddressSchema
}; 