/**
 * Shared Address Schema
 * Reusable address schema for embedding in other models
 */
import mongoose from 'mongoose';
import { schemaComposer } from 'graphql-compose';

// Create a sub-schema for addresses
const AddressSchema = new mongoose.Schema({
  street1: {
    type: String,
    trim: true,
  },
  street2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  postalCode: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
    default: 'US',
  },
  type: {
    type: String,
    enum: ['shipping', 'billing', 'home', 'work', 'other'],
    default: 'other',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere',
  },
  formattedAddress: {
    type: String,
    trim: true,
  },
}, { _id: false, timestamps: false });

// Create a TypeComposer for the schema directly without a model
const AddressTC = schemaComposer.createObjectTC({
  name: 'Address',
  description: 'Address information',
  fields: {
    street1: 'String',
    street2: 'String',
    city: 'String',
    state: 'String',
    postalCode: 'String',
    country: 'String',
    type: {
      type: 'String',
      description: 'Type of address (shipping, billing, etc.)'
    },
    isDefault: 'Boolean',
    coordinates: ['Float'],
    formattedAddress: 'String'
  }
});

// Export both the schema and type composer
export { AddressSchema, AddressTC }; 