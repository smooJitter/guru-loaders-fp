import mongoose from 'mongoose';
import cleanToJSON from '../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../lib/plugins/timestamps.js';
import { statusTrackable } from '../lib/plugins/status-trackable-flex.js';
import { taggable } from '../lib/plugins/taggable-flex.js';
import { scoreable } from '../lib/plugins/scoreable.js';
import { metadataSchema } from '../lib/shared_schema/metadata.schema.js';
import { CoverImageSchema } from '../lib/shared_schema/coverImage.schema.js';

const { Schema, model } = mongoose;

const songSchema = new Schema({
  // Core fields
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  artist: { 
    type: Schema.Types.ObjectId, 
    ref: 'Artist', 
    required: true 
  },
  album: { 
    type: Schema.Types.ObjectId, 
    ref: 'Album' 
  },
  
  // Audio file information
  audioFile: {
    url: { type: String, required: true },
    duration: { type: Number, required: true }, // in seconds
    format: { type: String, required: true },
    size: { type: Number, required: true }, // in bytes
    bitrate: { type: Number }, // in kbps
    sampleRate: { type: Number }, // in Hz
  },
  
  // Music metadata
  metadata: {
    genre: [String],
    year: Number,
    bpm: Number,
    key: String,
    language: String,
    isExplicit: { type: Boolean, default: false },
    copyright: String,
    isrc: String, // International Standard Recording Code
  },
  
  // Cover image
  coverImage: CoverImageSchema,
  
  // Shared metadata
  ...metadataSchema,
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Play count and popularity
  stats: {
    playCount: { type: Number, default: 0 },
    lastPlayed: Date,
    popularity: { type: Number, default: 0 }, // Calculated field
  }
}, {
  timestamps: true,
  versionKey: false
});

// Apply plugins
songSchema.plugin(statusTrackable, {
  field: 'status',
  allowedTypes: ['draft', 'published', 'archived']
});
songSchema.plugin(taggable, {
  field: 'tags',
  allowedTypes: ['genre', 'mood', 'instrument', 'custom']
});
songSchema.plugin(scoreable, {
  field: 'ratings',
  allowedTypes: ['overall', 'quality', 'popularity']
});
songSchema.plugin(cleanToJSON);
songSchema.plugin(timestampsPlugin);

// Indexes
songSchema.index({ title: 1, artist: 1 }, { unique: true });
songSchema.index({ artist: 1 });
songSchema.index({ album: 1 });
songSchema.index({ 'metadata.genre': 1 });
songSchema.index({ 'stats.popularity': -1 });
songSchema.index({ createdAt: -1 });

// Validation
songSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.title = this.title.trim();
  }
  
  // Validate audio file format
  if (this.isModified('audioFile.format')) {
    const validFormats = ['mp3', 'wav', 'flac', 'aac'];
    if (!validFormats.includes(this.audioFile.format.toLowerCase())) {
      next(new Error('Invalid audio format'));
    }
  }
  
  // Update popularity based on play count and ratings
  if (this.isModified('stats.playCount') || this.isModified('ratings')) {
    this.stats.popularity = calculatePopularity(this);
  }
  
  next();
});

// Helper function to calculate popularity
function calculatePopularity(song) {
  const playCountWeight = 0.6;
  const ratingWeight = 0.4;
  
  const normalizedPlayCount = Math.min(song.stats.playCount / 1000, 1);
  const averageRating = song.ratings?.reduce((acc, r) => acc + r.value, 0) / song.ratings?.length || 0;
  
  return (normalizedPlayCount * playCountWeight) + (averageRating * ratingWeight);
}

export default model('Song', songSchema); 