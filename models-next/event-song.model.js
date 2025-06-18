import timestampsPlugin from './plugins/mongoose-timestamps.plugin.js';
import cleanToJSON from './plugins/cleanToJSON.js';
import { statusTrackable } from './plugins/mongoose-status-trackable-flex.plugin.js';
import { taggable } from './plugins/mongoose-taggable-flex.plugin.js';
import { scoreable } from './plugins/mongoose-scoreable.plugin.js';
import { metadataSchema } from './schemas/metadata.schema.js';
import { CoverImageSchema } from './schemas/coverImage.schema.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const songSchema = new Schema({
    title: { type: String, required: true, trim: true },
    artist: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
    album: { type: Schema.Types.ObjectId, ref: 'Album' },
    audioFile: {
      url: { type: String, required: true },
      duration: { type: Number, required: true },
      format: { type: String, required: true },
      size: { type: Number, required: true },
      bitrate: { type: Number },
      sampleRate: { type: Number },
    },
    metadata: {
      genre: [String],
      year: Number,
      bpm: Number,
      key: String,
      language: String,
      isExplicit: { type: Boolean, default: false },
      copyright: String,
      isrc: String,
    },
    coverImage: CoverImageSchema,
    ...metadataSchema,
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    stats: {
      playCount: { type: Number, default: 0 },
      lastPlayed: Date,
      popularity: { type: Number, default: 0 },
    },
    userInteractions: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      interactionType: { type: String, enum: ['play', 'pause', 'skip'], required: true },
      timestamp: { type: Date, default: Date.now }
    }],
  }, {
    timestamps: true,
    versionKey: false
  });

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
  additionalPlugins.forEach(plugin => songSchema.plugin(plugin));

  songSchema.index({ title: 1, artist: 1 }, { unique: true });
  songSchema.index({ artist: 1 });
  songSchema.index({ album: 1 });
  songSchema.index({ 'metadata.genre': 1 });
  songSchema.index({ 'stats.popularity': -1 });
  songSchema.index({ createdAt: -1 });

  songSchema.pre('save', function(next) {
    if (this.isModified('title')) {
      this.title = this.title.trim();
    }
    if (this.isModified('audioFile.format')) {
      const validFormats = ['mp3', 'wav', 'flac', 'aac'];
      if (!validFormats.includes(this.audioFile.format.toLowerCase())) {
        next(new Error('Invalid audio format'));
      }
    }
    if (this.isModified('stats.playCount') || this.isModified('ratings')) {
      this.stats.popularity = calculatePopularity(this);
    }
    next();
  });

  function calculatePopularity(song) {
    const playCountWeight = 0.5;
    const ratingWeight = 0.3;
    const interactionWeight = 0.2;
    const normalizedPlayCount = Math.min(song.stats.playCount / 1000, 1);
    const averageRating = song.ratings?.reduce((acc, r) => acc + r.value, 0) / song.ratings?.length || 0;
    const interactionScore = song.userInteractions.length / 100;
    return (normalizedPlayCount * playCountWeight) + (averageRating * ratingWeight) + (interactionScore * interactionWeight);
  }

  if (mongooseConnection.models.Song) {
    return mongooseConnection.models.Song;
  }
  return mongooseConnection.model('Song', songSchema);
}; 