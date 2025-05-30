/**
 * Shared Metadata Type Composers
 * @module gcm-type-composers/lib/shared/core/metadata.typeComposer
 * @see domain-models/lib/shared_schema/core/metadata.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create MetadataValue type composer
export const MetadataValueTC = schemaComposer.createObjectTC({
  name: 'MetadataValue',
  description: 'Flexible metadata value storage',
  fields: {
    type: {
      type: 'enum MetadataValueType { string number boolean date object array }',
      description: 'Type of the stored value'
    },
    value: {
      type: 'JSON',
      description: 'The actual value stored'
    },
    label: {
      type: 'String',
      description: 'Optional display label for the value'
    }
  }
});

// Create MetadataField type composer
export const MetadataFieldTC = schemaComposer.createObjectTC({
  name: 'MetadataField',
  description: 'Metadata field definition',
  fields: {
    key: {
      type: 'String!',
      description: 'Unique identifier for this field'
    },
    type: {
      type: 'enum MetadataFieldType { string number boolean date object array }',
      description: 'Expected type of values'
    },
    label: {
      type: 'String',
      description: 'Human-readable label'
    },
    description: {
      type: 'String',
      description: 'Detailed field description'
    },
    required: {
      type: 'Boolean',
      description: 'Whether this field is required',
      defaultValue: false
    },
    defaultValue: {
      type: 'JSON',
      description: 'Default value if none provided'
    },
    validation: {
      type: 'JSON',
      description: 'Validation rules for this field'
    }
  }
});

// Create main Metadata type composer
export const MetadataTC = schemaComposer.createObjectTC({
  name: 'Metadata',
  description: 'Flexible metadata container',
  fields: {
    namespace: {
      type: 'String!',
      description: 'Namespace for grouping related metadata'
    },
    fields: {
      type: '[MetadataField!]',
      description: 'Field definitions for this namespace'
    },
    values: {
      type: 'JSON',
      description: 'Map of field values'
    }
  }
});

// Add input validation
MetadataValueTC.getInputTypeComposer().addValidator(value => {
  if (value.type && !['string', 'number', 'boolean', 'date', 'object', 'array'].includes(value.type)) {
    throw new Error('Invalid metadata value type');
  }
  
  if (value.value !== undefined) {
    switch (value.type) {
      case 'string':
        if (typeof value.value !== 'string') throw new Error('Value must be a string');
        break;
      case 'number':
        if (typeof value.value !== 'number') throw new Error('Value must be a number');
        break;
      case 'boolean':
        if (typeof value.value !== 'boolean') throw new Error('Value must be a boolean');
        break;
      case 'date':
        if (!(value.value instanceof Date)) throw new Error('Value must be a date');
        break;
    }
  }
}); 