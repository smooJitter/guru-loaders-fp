import mongoose from 'mongoose';
import cleanToJSON from '../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../lib/plugins/timestamps.js';
import { statusTrackable } from '../lib/plugins/status-trackable-flex.js';
import { metadataSchema } from '../lib/shared_schema/metadata.schema.js';

const { Schema, model } = mongoose;

const songSwipeSchema = new Schema({
  // Core fields
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  songId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Song', 
    required: true 
  },
  
  // Swipe action
  action: {
    type: String,
    enum: ['like', 'dislike', 'skip'],
    required: true
  },
  
  // Interaction metadata
  interaction: {
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number }, // How long the song was played before swipe
    position: { type: Number }, // Position in the song when swiped (in seconds)
    context: { type: String }, // e.g., 'discovery', 'playlist', 'radio'
  },
  
  // Feedback (optional)
  feedback: {
    reason: { type: String }, // Why the user swiped this way
    mood: { type: String }, // User's mood at time of swipe
    genre: { type: String }, // Genre the user thought it was
  },
  
  // Shared metadata
  ...metadataSchema,
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Apply plugins
songSwipeSchema.plugin(statusTrackable, {
  field: 'status',
  allowedTypes: ['active', 'deleted']
});
songSwipeSchema.plugin(cleanToJSON);
songSwipeSchema.plugin(timestampsPlugin);

// Indexes
songSwipeSchema.index({ userId: 1, songId: 1 }, { unique: true }); // One swipe per user per song
songSwipeSchema.index({ userId: 1, action: 1 }); // For querying user's likes/dislikes
songSwipeSchema.index({ songId: 1, action: 1 }); // For song popularity metrics
songSwipeSchema.index({ 'interaction.timestamp': -1 }); // For recent activity
songSwipeSchema.index({ createdAt: -1 });

// Validation
songSwipeSchema.pre('save', function(next) {
  // Ensure one swipe per user per song
  if (this.isModified('userId') || this.isModified('songId')) {
    this.constructor.findOne({
      userId: this.userId,
      songId: this.songId,
      _id: { $ne: this._id }
    }).then(existing => {
      if (existing) {
        next(new Error('User has already swiped on this song'));
      } else {
        next();
      }
    }).catch(next);
  } else {
    next();
  }
});

// Instance methods
songSwipeSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default model('SongSwipe', songSwipeSchema); 