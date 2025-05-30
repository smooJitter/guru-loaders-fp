/**
 * Index file for shared mongoose schemas
 * Exports all reusable schemas and TypeComposers for use throughout the application
 */

// Import all schemas directly
import {
  AddressSchema,
  AddressTC
} from './contact/address.schema.js';

import {
  EmailSchema,
  EmailTC,
  PhoneSchema,
  PhoneTC,
  ContactSchema,
  ContactTC
} from './contact/contact.schema.js';

import {
  GeoPointSchema,
  GeoPointTC,
  GeoPolygonSchema,
  GeoPolygonTC,
  LocationSchema,
  LocationTC
} from './location/geo.schema.js';

import {
  MetadataValueSchema,
  MetadataValueTC,
  MetadataFieldSchema,
  MetadataFieldTC,
  MetadataSchema,
  MetadataTC,
  metadataMethods
} from './core/metadata.schema.js';

import {
  ImageSizeSchema,
  ImageSizeTC,
  CoverImageSchema,
  CoverImageTC,
  coverImageMethods
} from './media/coverImage.schema.js';

import {
  TicketPricingSchema,
  TicketPurchaseSchema,
  TicketUsageSchema,
  TicketSchema
} from './payment/ticketing.schema.js';

// Re-export all schemas
export * from './contact/address.schema.js';
export * from './contact/contact.schema.js';
export * from './location/geo.schema.js';
export * from './core/metadata.schema.js';
export * from './media/coverImage.schema.js';
export * from './payment/ticketing.schema.js';

// Schema registry - provides a convenient way to access all schemas
export const sharedSchemas = {
  // Address schemas
  AddressSchema,
  AddressTC,
  
  // Contact schemas
  EmailSchema,
  EmailTC,
  PhoneSchema,
  PhoneTC,
  ContactSchema,
  ContactTC,
  
  // Geo schemas
  GeoPointSchema,
  GeoPointTC,
  GeoPolygonSchema,
  GeoPolygonTC,
  LocationSchema,
  LocationTC,
  
  // Metadata schemas
  MetadataValueSchema,
  MetadataValueTC,
  MetadataFieldSchema,
  MetadataFieldTC,
  MetadataSchema,
  MetadataTC,
  metadataMethods,
  
  // Cover Image schemas
  ImageSizeSchema,
  ImageSizeTC,
  CoverImageSchema,
  CoverImageTC,
  coverImageMethods,

  // Ticketing schemas
  TicketPricingSchema,
  TicketPurchaseSchema,
  TicketUsageSchema,
  TicketSchema,
};

// Helper method to attach schema methods to a model schema
export function attachMetadataMethods(schema) {
  schema.methods.setMetadata = metadataMethods.setMetadata;
  schema.methods.getMetadata = metadataMethods.getMetadata;
  schema.methods.removeMetadata = metadataMethods.removeMetadata;
  schema.methods.getNamespaceMetadata = metadataMethods.getNamespaceMetadata;
  
  return schema;
}

// Helper method to attach cover image methods to a model schema
export function attachCoverImageMethods(schema) {
  schema.methods.getImageSize = coverImageMethods.getImageSize;
  schema.methods.getImageUrl = coverImageMethods.getImageUrl;
  schema.methods.setPrimaryCoverImage = coverImageMethods.setPrimaryCoverImage;
  schema.methods.getPrimaryCoverImage = coverImageMethods.getPrimaryCoverImage;
  
  return schema;
} 