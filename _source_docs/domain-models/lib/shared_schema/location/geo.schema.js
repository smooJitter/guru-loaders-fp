/**
 * Shared GeoJSON Schema
 * Reusable schema for geo-spatial data
 */
import mongoose from 'mongoose';
import { schemaComposer } from 'graphql-compose';

// GeoJSON Point Schema
const GeoPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    index: '2dsphere'
  }
}, { _id: false, timestamps: false });

// GeoJSON Polygon Schema
const GeoPolygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    default: 'Polygon',
    required: true
  },
  coordinates: {
    type: [[[Number]]], // Array of linear rings (first is outer, rest are holes)
    required: true,
    index: '2dsphere'
  }
}, { _id: false, timestamps: false });

// Location Schema (with metadata)
const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  point: {
    type: GeoPointSchema
  },
  area: {
    type: GeoPolygonSchema
  },
  address: {
    type: String,
    trim: true
  },
  placeId: {
    type: String, // For integration with mapping services like Google Places
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { _id: false, timestamps: false });

// Create TypeComposers directly without models
const GeoPointTC = schemaComposer.createObjectTC({
  name: 'GeoPoint',
  description: 'Geographic point data following the GeoJSON format',
  fields: {
    type: {
      type: 'String!',
      description: 'GeoJSON type, always "Point" for this schema'
    },
    coordinates: {
      type: '[Float!]!',
      description: 'Coordinates as [longitude, latitude]'
    }
  }
});

const GeoPolygonTC = schemaComposer.createObjectTC({
  name: 'GeoPolygon',
  description: 'Geographic polygon data following the GeoJSON format',
  fields: {
    type: {
      type: 'String!',
      description: 'GeoJSON type, always "Polygon" for this schema'
    },
    coordinates: {
      type: '[[[Float!]!]!]!',
      description: 'Array of linear rings (first is outer, rest are holes)'
    }
  }
});

const LocationTC = schemaComposer.createObjectTC({
  name: 'Location',
  description: 'Location information with geographic data',
  fields: {
    name: 'String',
    description: 'String',
    point: GeoPointTC,
    area: GeoPolygonTC,
    address: 'String',
    placeId: 'String',
    metadata: 'JSON'
  }
});

// Export schemas and type composers
export {
  GeoPointSchema,
  GeoPointTC,
  GeoPolygonSchema,
  GeoPolygonTC,
  LocationSchema,
  LocationTC
}; 