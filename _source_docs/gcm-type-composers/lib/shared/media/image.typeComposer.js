/**
 * Shared Image Type Composers
 * @module gcm-type-composers/lib/shared/media/image.typeComposer
 * @see domain-models/lib/shared_schema/media/image.schema.js
 */

import { schemaComposer } from 'graphql-compose';

// Create ImageVariant type composer
export const ImageVariantTC = schemaComposer.createObjectTC({
  name: 'ImageVariant',
  description: 'Image variant with specific dimensions and format',
  fields: {
    url: {
      type: 'String!',
      description: 'URL to access this variant'
    },
    width: {
      type: 'Int!',
      description: 'Width in pixels'
    },
    height: {
      type: 'Int!',
      description: 'Height in pixels'
    },
    size: {
      type: 'Int!',
      description: 'File size in bytes'
    },
    format: {
      type: 'enum ImageFormat { jpg jpeg png gif webp }',
      description: 'Image file format'
    },
    quality: {
      type: 'Int',
      description: 'Image quality (1-100)',
      defaultValue: 80
    },
    purpose: {
      type: 'enum ImagePurpose { thumbnail preview full original }',
      description: 'Intended use of this variant'
    }
  }
});

// Create ProcessingError type composer
export const ProcessingErrorTC = schemaComposer.createObjectTC({
  name: 'ImageProcessingError',
  description: 'Error during image processing',
  fields: {
    code: {
      type: 'String!',
      description: 'Error code'
    },
    message: {
      type: 'String!',
      description: 'Error message'
    },
    timestamp: {
      type: 'Date!',
      description: 'When the error occurred'
    }
  }
});

// Create main Image type composer
export const ImageTC = schemaComposer.createObjectTC({
  name: 'Image',
  description: 'Image asset with variants',
  fields: {
    filename: {
      type: 'String!',
      description: 'Original filename'
    },
    originalUrl: {
      type: 'String!',
      description: 'URL to original file'
    },
    mimeType: {
      type: 'String!',
      description: 'MIME type of original file'
    },
    size: {
      type: 'Int!',
      description: 'Size in bytes of original file'
    },
    width: {
      type: 'Int!',
      description: 'Width in pixels of original'
    },
    height: {
      type: 'Int!',
      description: 'Height in pixels of original'
    },
    variants: {
      type: '[ImageVariant!]',
      description: 'Generated image variants'
    },
    alt: {
      type: 'String',
      description: 'Alt text for accessibility'
    },
    caption: {
      type: 'String',
      description: 'Optional image caption'
    },
    credit: {
      type: 'String',
      description: 'Attribution/credit information'
    },
    entityType: {
      type: 'String!',
      description: 'Type of entity this image belongs to'
    },
    entityId: {
      type: 'MongoID!',
      description: 'ID of entity this image belongs to'
    },
    uploadedBy: {
      type: 'MongoID!',
      description: 'User who uploaded the image'
    },
    status: {
      type: 'enum ImageStatus { processing active failed deleted }',
      description: 'Current processing status',
      defaultValue: 'processing'
    },
    metadata: {
      type: 'JSON',
      description: 'Additional metadata'
    },
    tags: {
      type: '[String!]',
      description: 'Image tags'
    },
    processingErrors: {
      type: '[ImageProcessingError!]',
      description: 'Any errors during processing'
    },
    usage: {
      type: 'JSON',
      description: 'Usage statistics by context'
    },
    aspectRatio: {
      type: 'Float!',
      description: 'Image aspect ratio (width/height)',
      resolve: source => source.width / source.height
    }
  }
});

// Add input validation
ImageTC.getInputTypeComposer().addValidator(value => {
  if (value.width && value.width < 1) {
    throw new Error('Width must be positive');
  }
  if (value.height && value.height < 1) {
    throw new Error('Height must be positive');
  }
  if (value.size && value.size < 1) {
    throw new Error('Size must be positive');
  }
  if (value.variants) {
    value.variants.forEach(variant => {
      if (variant.quality && (variant.quality < 1 || variant.quality > 100)) {
        throw new Error('Quality must be between 1 and 100');
      }
    });
  }
}); 