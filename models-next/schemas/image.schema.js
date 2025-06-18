/**
 * Image Schema
 * @module domain-models/lib/shared_schema/media/image
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const ImageVariantSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  format: {
    type: String,
    enum: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    required: true
  },
  quality: {
    type: Number,
    min: 1,
    max: 100
  },
  purpose: {
    type: String,
    enum: ['thumbnail', 'preview', 'full', 'original'],
    required: true
  }
}, { _id: false });

const ImageSchema = new Schema({
  filename: {
    type: String,
    required: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  variants: [ImageVariantSchema],
  alt: String,
  caption: String,
  credit: String,
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'active', 'failed', 'deleted'],
    default: 'processing'
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  tags: [String],
  processingErrors: [{
    code: String,
    message: String,
    timestamp: Date
  }],
  usage: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
ImageSchema.index({ entityType: 1, entityId: 1 });
ImageSchema.index({ uploadedBy: 1, createdAt: -1 });
ImageSchema.index({ status: 1 });
ImageSchema.index({ tags: 1 });

// Virtual for aspect ratio
ImageSchema.virtual('aspectRatio').get(function() {
  return this.width / this.height;
});

// Methods
ImageSchema.methods.addVariant = function(variant) {
  const existingIndex = this.variants.findIndex(v => 
    v.purpose === variant.purpose
  );
  
  if (existingIndex >= 0) {
    this.variants[existingIndex] = variant;
  } else {
    this.variants.push(variant);
  }
};

ImageSchema.methods.getVariant = function(purpose) {
  return this.variants.find(v => v.purpose === purpose);
};

ImageSchema.methods.recordUsage = function(context) {
  const currentCount = this.usage.get(context) || 0;
  this.usage.set(context, currentCount + 1);
};

ImageSchema.methods.addProcessingError = function(code, message) {
  this.processingErrors.push({
    code,
    message,
    timestamp: new Date()
  });
  
  if (this.processingErrors.length >= 3) {
    this.status = 'failed';
  }
};

export { ImageSchema, ImageVariantSchema }; 