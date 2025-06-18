/**
 * Shared Cover Image Schema
 * Reusable schema for cover/profile images with various sizes and formats
 */
import mongoose from 'mongoose';


// Image Size Schema
const ImageSizeSchema = new mongoose.Schema({
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: Number, // Size in bytes
  },
  // For responsive images (optional)
  mediaQuery: {
    type: String,
    trim: true,
  }
}, { _id: false, timestamps: false });

// Cover Image Schema
const CoverImageSchema = new mongoose.Schema({
  // Original image
  original: {
    type: ImageSizeSchema,
    required: true,
  },
  // Different size variants
  small: {
    type: ImageSizeSchema,
  },
  medium: {
    type: ImageSizeSchema,
  },
  large: {
    type: ImageSizeSchema,
  },
  // Additional available sizes (optional)
  sizes: [ImageSizeSchema],
  // Alt text for accessibility
  alt: {
    type: String,
    trim: true,
  },
  // Caption or description
  caption: {
    type: String,
    trim: true,
  },
  // Image attribution
  attribution: {
    type: String,
    trim: true,
  },
  // Focal point (for cropping)
  focalPoint: {
    x: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    y: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    }
  },
  // Storage information
  storage: {
    provider: {
      type: String,
      trim: true,
      enum: ['local', 's3', 'cloudinary', 'gcs', 'other'],
      default: 'local',
    },
    bucket: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    // Additional provider-specific metadata
    meta: {
      type: mongoose.Schema.Types.Mixed,
    }
  },
  // Content type
  mimeType: {
    type: String,
    trim: true,
  },
  // When the image was uploaded
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  // Whether this is the primary image
  isPrimary: {
    type: Boolean,
    default: false,
  },
  // Status of the image (e.g., for moderation)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
}, { _id: false, timestamps: false });


// Helper functions for cover images
const coverImageMethods = {
  // Get the appropriate image size based on target dimensions or name
  getImageSize(options = {}) {
    const { width, height, size = 'medium' } = options;
    
    if (!this.coverImage) return null;
    
    // If specific dimensions requested, find closest match
    if (width && height) {
      // Start with original if nothing else matches
      let bestMatch = this.coverImage.original;
      let bestMatchArea = Infinity;
      
      // Check predefined sizes
      const sizesToCheck = [
        this.coverImage.small, 
        this.coverImage.medium, 
        this.coverImage.large,
        ...(this.coverImage.sizes || [])
      ].filter(Boolean);
      
      for (const img of sizesToCheck) {
        // Calculate how much larger the image is than the requested size
        // We prefer images that are larger than requested but not too much larger
        if (img.width >= width && img.height >= height) {
          const area = img.width * img.height;
          const requestedArea = width * height;
          const ratio = area / requestedArea;
          
          // If this is closer to 1:1 ratio with requested dimensions
          if (ratio < bestMatchArea) {
            bestMatch = img;
            bestMatchArea = ratio;
          }
        }
      }
      
      return bestMatch;
    }
    
    // If named size requested
    switch (size) {
      case 'original':
        return this.coverImage.original;
      case 'small':
        return this.coverImage.small || this.coverImage.original;
      case 'medium':
        return this.coverImage.medium || this.coverImage.original;
      case 'large':
        return this.coverImage.large || this.coverImage.original;
      default:
        return this.coverImage.original;
    }
  },
  
  // Get the URL for a specific image size
  getImageUrl(options = {}) {
    const image = this.getImageSize(options);
    return image ? image.url : null;
  },
  
  // Set the primary cover image when there might be multiple
  setPrimaryCoverImage(id) {
    if (!this.coverImages || !Array.isArray(this.coverImages)) {
      return this;
    }
    
    this.coverImages = this.coverImages.map(img => ({
      ...img,
      isPrimary: img._id.toString() === id.toString()
    }));
    
    return this;
  },
  
  // Get the primary cover image when there are multiple
  getPrimaryCoverImage() {
    if (!this.coverImages || !Array.isArray(this.coverImages)) {
      return this.coverImage || null;
    }
    
    return this.coverImages.find(img => img.isPrimary) || this.coverImages[0] || null;
  }
};

// Export schemas, type composers and helper methods
export {
  ImageSizeSchema,

  CoverImageSchema,

  coverImageMethods
}; 