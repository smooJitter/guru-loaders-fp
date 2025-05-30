/**
 * Shared validators for address-related schemas
 * Used by both Mongoose models and GraphQL type composers
 * @module domain-models/lib/validators/address.validators
 */

// Address type enumeration
export const ADDRESS_TYPES = [
  'residential',
  'business',
  'shipping',
  'billing',
  'venue'
];

// Mongoose validators
export const addressValidators = {
  street: {
    trim: true,
    maxlength: [100, 'Street address cannot exceed 100 characters'],
    required: [true, 'Street address is required']
  },
  city: {
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters'],
    required: [true, 'City is required']
  },
  state: {
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  postalCode: {
    trim: true,
    maxlength: [20, 'Postal code cannot exceed 20 characters'],
    required: [true, 'Postal code is required']
  },
  country: {
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters'],
    required: [true, 'Country is required']
  },
  type: {
    enum: {
      values: ADDRESS_TYPES,
      message: 'Invalid address type'
    }
  }
};

export const coordinatesValidators = {
  latitude: {
    type: Number,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90'],
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180'],
    required: [true, 'Longitude is required']
  }
};

// GraphQL validation rules
export const graphqlValidationRules = {
  street: {
    validator: value => {
      return value && value.length <= 100;
    },
    message: 'Street address is required and cannot exceed 100 characters'
  },
  city: {
    validator: value => {
      return value && value.length <= 100;
    },
    message: 'City is required and cannot exceed 100 characters'
  },
  state: {
    validator: value => {
      return !value || value.length <= 50;
    },
    message: 'State cannot exceed 50 characters'
  },
  postalCode: {
    validator: value => {
      return value && value.length <= 20;
    },
    message: 'Postal code is required and cannot exceed 20 characters'
  },
  country: {
    validator: value => {
      return value && value.length <= 100;
    },
    message: 'Country is required and cannot exceed 100 characters'
  },
  type: {
    validator: value => ADDRESS_TYPES.includes(value),
    message: 'Invalid address type'
  },
  coordinates: {
    latitude: {
      validator: value => value >= -90 && value <= 90,
      message: 'Latitude must be between -90 and 90'
    },
    longitude: {
      validator: value => value >= -180 && value <= 180,
      message: 'Longitude must be between -180 and 180'
    }
  }
};

// Format validation helpers
export const formatValidators = {
  isValidPostalCode: (code, country) => {
    // Add country-specific postal code validation
    const patterns = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/
    };
    
    return !patterns[country] || patterns[country].test(code);
  },
  
  isValidCoordinates: (lat, lng) => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }
}; 