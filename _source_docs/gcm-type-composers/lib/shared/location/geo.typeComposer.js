/**
 * Shared Geo Type Composers
 * @module gcm-type-composers/lib/shared/location/geo.typeComposer
 * @see domain-models/lib/shared_schema/location/geo.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create GeoPoint type composer
export const GeoPointTC = schemaComposer.createObjectTC({
  name: 'GeoPoint',
  description: 'Geographic point coordinates',
  fields: {
    type: {
      type: 'String!',
      description: 'GeoJSON type',
      defaultValue: 'Point'
    },
    coordinates: {
      type: '[Float!]!',
      description: 'Coordinates [longitude, latitude]'
    }
  }
});

// Create GeoPolygon type composer
export const GeoPolygonTC = schemaComposer.createObjectTC({
  name: 'GeoPolygon',
  description: 'Geographic polygon',
  fields: {
    type: {
      type: 'String!',
      description: 'GeoJSON type',
      defaultValue: 'Polygon'
    },
    coordinates: {
      type: '[[Float!]!]!',
      description: 'Array of coordinate arrays forming polygon rings'
    }
  }
});

// Create Location type composer
export const LocationTC = schemaComposer.createObjectTC({
  name: 'Location',
  description: 'Geographic location with metadata',
  fields: {
    name: {
      type: 'String',
      description: 'Location name'
    },
    point: {
      type: 'GeoPoint!',
      description: 'Geographic point'
    },
    address: {
      type: 'Address',
      description: 'Physical address'
    },
    type: {
      type: 'enum LocationType { venue business residence landmark other }',
      description: 'Type of location',
      defaultValue: 'other'
    },
    timezone: {
      type: 'String',
      description: 'IANA timezone identifier'
    },
    metadata: {
      type: 'JSON',
      description: 'Additional location data'
    },
    boundingBox: {
      type: 'GeoPolygon',
      description: 'Geographic boundary'
    }
  }
});

// Add input validation
[GeoPointTC, GeoPolygonTC].forEach(tc => {
  tc.getInputTypeComposer().addValidator(value => {
    if (value.coordinates) {
      if (tc === GeoPointTC) {
        if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
          throw new Error('Point coordinates must be [longitude, latitude]');
        }
        const [lon, lat] = value.coordinates;
        if (lon < -180 || lon > 180) throw new Error('Invalid longitude');
        if (lat < -90 || lat > 90) throw new Error('Invalid latitude');
      }
      
      if (tc === GeoPolygonTC) {
        if (!Array.isArray(value.coordinates) || value.coordinates.length === 0) {
          throw new Error('Polygon must have at least one ring');
        }
        
        value.coordinates.forEach((ring, i) => {
          if (!Array.isArray(ring) || ring.length < 4) {
            throw new Error(`Ring ${i} must have at least 4 points`);
          }
          
          // First and last points must be the same
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            throw new Error(`Ring ${i} must be closed (first point = last point)`);
          }
          
          ring.forEach(([lon, lat], j) => {
            if (lon < -180 || lon > 180) throw new Error(`Invalid longitude in ring ${i} point ${j}`);
            if (lat < -90 || lat > 90) throw new Error(`Invalid latitude in ring ${i} point ${j}`);
          });
        });
      }
    }
  });
}); 