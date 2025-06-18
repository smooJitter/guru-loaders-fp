import timestampsPlugin from './plugins/mongoose-timestamps.plugin.js';
import cleanToJSON from './plugins/cleanToJSON.js';
import { statusTrackable } from './plugins/mongoose-status-trackable-flex.plugin.js';
import { metadataSchema } from './schemas/metadata.schema.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const songSwipeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    action: { type: String, enum: ['like', 'dislike', 'skip'], required: true },
    interaction: {
      timestamp: { type: Date, default: Date.now },
      duration: { type: Number },
      position: { type: Number },
      context: { type: String },
      contextDetails: {
        device: { type: String },
        location: { type: String },
        networkType: { type: String }
      },
    },
    feedback: {
      reason: { type: String },
      mood: { type: String },
      genre: { type: String },
    },
    ...metadataSchema,
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active'
    }
  }, {
    timestamps: true,
    versionKey: false
  });

  songSwipeSchema.plugin(statusTrackable, {
    field: 'status',
    allowedTypes: ['active', 'deleted']
  });
  songSwipeSchema.plugin(cleanToJSON);
  songSwipeSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => songSwipeSchema.plugin(plugin));

  songSwipeSchema.index({ userId: 1, songId: 1 }, { unique: true });
  songSwipeSchema.index({ userId: 1, action: 1 });
  songSwipeSchema.index({ songId: 1, action: 1 });
  songSwipeSchema.index({ 'interaction.timestamp': -1 });
  songSwipeSchema.index({ createdAt: -1 });

  songSwipeSchema.pre('save', function(next) {
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
    } else if (this.isModified('interaction.contextDetails')) {
      if (!this.interaction.contextDetails.device) {
        next(new Error('Device information is required'));
      }
    } else {
      next();
    }
  });

  songSwipeSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
  };

  if (mongooseConnection.models.SongSwipe) {
    return mongooseConnection.models.SongSwipe;
  }
  return mongooseConnection.model('SongSwipe', songSwipeSchema);
}; 