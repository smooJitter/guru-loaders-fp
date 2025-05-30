/**
 * Shared Metadata Schema
 * Reusable schema for storing flexible metadata with various data types 
 */
import mongoose from 'mongoose';
// import { schemaComposer } from 'graphql-compose';

// Value schema for strong typing
const MetadataValueSchema = new mongoose.Schema({
  stringValue: {
    type: String,
    trim: true,
  },
  numberValue: {
    type: Number,
  },
  booleanValue: {
    type: Boolean,
  },
  dateValue: {
    type: Date,
  },
  arrayValue: {
    type: [mongoose.Schema.Types.Mixed],
  },
  objectValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  // Type of the value stored
  valueType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object', 'null'],
    required: true,
  },
}, { _id: false, timestamps: false });

// Metadata field schema
const MetadataFieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: MetadataValueSchema,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  namespace: {
    type: String,
    trim: true,
    default: 'default',
  },
  schema: {
    type: String,
    trim: true,
  },
}, { _id: false, timestamps: false });

// Main metadata schema
const MetadataSchema = new mongoose.Schema({
  fields: [MetadataFieldSchema],
  // Add a Map for more direct access patterns where typed value isn't critical
  simpleValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false, timestamps: false });

/*
// Create GraphQL types directly without models
const MetadataValueTC = schemaComposer.createObjectTC({
  name: 'MetadataValue',
  description: 'Strongly typed metadata value',
  fields: {
    stringValue: 'String',
    numberValue: 'Float',
    booleanValue: 'Boolean',
    dateValue: 'Date',
    arrayValue: '[JSON]',
    objectValue: 'JSON',
    valueType: {
      type: 'String!',
      description: 'Type of the stored value'
    }
  }
});

const MetadataFieldTC = schemaComposer.createObjectTC({
  name: 'MetadataField',
  description: 'Metadata field with key and typed value',
  fields: {
    key: 'String!',
    value: MetadataValueTC,
    description: 'String',
    isSystem: 'Boolean!',
    namespace: 'String!',
    schema: 'String'
  }
});

const MetadataTC = schemaComposer.createObjectTC({
  name: 'Metadata',
  description: 'Collection of metadata fields and simple key-value pairs',
  fields: {
    fields: [MetadataFieldTC],
    simpleValues: 'JSON'
  }
});
*/
// Helper methods (can be attached to schemas that use the MetadataSchema)
const metadataMethods = {
  // Set a metadata value with type detection
  setMetadata(key, value, options = {}) {
    const { namespace = 'default', description = '', isSystem = false, schema = '' } = options;
    
    // Determine value type
    let valueType = 'null';
    if (value === null || value === undefined) {
      valueType = 'null';
    } else if (typeof value === 'string') {
      valueType = 'string';
    } else if (typeof value === 'number') {
      valueType = 'number';
    } else if (typeof value === 'boolean') {
      valueType = 'boolean';
    } else if (value instanceof Date) {
      valueType = 'date';
    } else if (Array.isArray(value)) {
      valueType = 'array';
    } else if (typeof value === 'object') {
      valueType = 'object';
    }
    
    // Prepare the value object
    const metadataValue = {
      valueType,
      stringValue: valueType === 'string' ? value : undefined,
      numberValue: valueType === 'number' ? value : undefined,
      booleanValue: valueType === 'boolean' ? value : undefined,
      dateValue: valueType === 'date' ? value : undefined,
      arrayValue: valueType === 'array' ? value : undefined,
      objectValue: valueType === 'object' ? value : undefined,
    };
    
    // Prepare the field
    const metadataField = {
      key,
      value: metadataValue,
      description,
      isSystem,
      namespace,
      schema,
    };
    
    // Initialize metadata if not present
    if (!this.metadata) {
      this.metadata = { fields: [], simpleValues: new Map() };
    }
    
    // Find existing field index
    const existingIndex = this.metadata.fields.findIndex(
      field => field.key === key && field.namespace === namespace
    );
    
    // Update or add the field
    if (existingIndex >= 0) {
      this.metadata.fields[existingIndex] = metadataField;
    } else {
      this.metadata.fields.push(metadataField);
    }
    
    // Update simple values map
    this.metadata.simpleValues.set(key, value);
    
    return this;
  },
  
  // Get a typed metadata value
  getMetadata(key, namespace = 'default') {
    if (!this.metadata || !this.metadata.fields) return null;
    
    const field = this.metadata.fields.find(
      field => field.key === key && field.namespace === namespace
    );
    
    if (!field) return null;
    
    // Return the appropriate value based on type
    switch (field.value.valueType) {
      case 'string':
        return field.value.stringValue;
      case 'number':
        return field.value.numberValue;
      case 'boolean':
        return field.value.booleanValue;
      case 'date':
        return field.value.dateValue;
      case 'array':
        return field.value.arrayValue;
      case 'object':
        return field.value.objectValue;
      default:
        return null;
    }
  },
  
  // Remove a metadata field
  removeMetadata(key, namespace = 'default') {
    if (!this.metadata || !this.metadata.fields) return this;
    
    this.metadata.fields = this.metadata.fields.filter(
      field => !(field.key === key && field.namespace === namespace)
    );
    
    // Remove from simple values
    this.metadata.simpleValues.delete(key);
    
    return this;
  },
  
  // Get all metadata fields for a specific namespace
  getNamespaceMetadata(namespace = 'default') {
    if (!this.metadata || !this.metadata.fields) return [];
    
    return this.metadata.fields
      .filter(field => field.namespace === namespace)
      .reduce((result, field) => {
        // Extract values based on type
        let value;
        switch (field.value.valueType) {
          case 'string':
            value = field.value.stringValue;
            break;
          case 'number':
            value = field.value.numberValue;
            break;
          case 'boolean':
            value = field.value.booleanValue;
            break;
          case 'date':
            value = field.value.dateValue;
            break;
          case 'array':
            value = field.value.arrayValue;
            break;
          case 'object':
            value = field.value.objectValue;
            break;
          default:
            value = null;
        }
        
        result[field.key] = value;
        return result;
      }, {});
  }
};

// Export schemas, type composers and helper methods
export {
  MetadataValueSchema,
  // MetadataValueTC,
  MetadataFieldSchema,
  // MetadataFieldTC,
  MetadataSchema,
  MetadataTC,
  metadataMethods
}; 