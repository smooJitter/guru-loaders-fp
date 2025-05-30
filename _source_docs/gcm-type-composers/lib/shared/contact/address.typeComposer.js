/**
 * Shared Address Type Composers
 * @module gcm-type-composers/lib/shared/contact/address.typeComposer
 * @see domain-models/lib/shared_schema/contact/address.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create Address type composer
export const AddressTC = schemaComposer.createObjectTC({
  name: 'Address',
  description: 'Physical address information',
  fields: {
    street1: {
      type: 'String',
      description: 'Primary street address'
    },
    street2: {
      type: 'String',
      description: 'Secondary street address'
    },
    city: {
      type: 'String',
      description: 'City name'
    },
    state: {
      type: 'String',
      description: 'State/province/region'
    },
    postalCode: {
      type: 'String',
      description: 'Postal/ZIP code'
    },
    country: {
      type: 'String',
      description: 'Country code',
      defaultValue: 'US'
    },
    type: {
      type: 'enum AddressType { shipping billing home work other }',
      description: 'Type of address',
      defaultValue: 'other'
    },
    isDefault: {
      type: 'Boolean',
      description: 'Whether this is the default address of its type',
      defaultValue: false
    },
    coordinates: {
      type: '[Float]',
      description: 'Geo coordinates [longitude, latitude]'
    },
    formattedAddress: {
      type: 'String',
      description: 'Full formatted address string'
    }
  }
});

// Add input validation
AddressTC.getInputTypeComposer().addValidator(value => {
  // Required fields for a valid address
  if (value.street1 && value.street1.length < 1) {
    throw new Error('Street address cannot be empty');
  }
  
  if (value.city && value.city.length < 1) {
    throw new Error('City cannot be empty');
  }
  
  if (value.postalCode) {
    // Basic postal code format validation
    const postalRegex = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/
    };
    
    const regex = postalRegex[value.country || 'US'];
    if (regex && !regex.test(value.postalCode)) {
      throw new Error('Invalid postal code format for country');
    }
  }
  
  if (value.coordinates) {
    if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
      throw new Error('Coordinates must be an array of [longitude, latitude]');
    }
    const [lon, lat] = value.coordinates;
    if (lon < -180 || lon > 180) throw new Error('Invalid longitude');
    if (lat < -90 || lat > 90) throw new Error('Invalid latitude');
  }
}); 