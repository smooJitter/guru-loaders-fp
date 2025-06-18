import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const songRequestSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending', required: true },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    priority: { type: Number, default: 0 },
    metadata: { type: Object }
  });

  songRequestSchema.plugin(cleanToJSON);
  songRequestSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => songRequestSchema.plugin(plugin));

  if (mongooseConnection.models.SongRequest) {
    return mongooseConnection.models.SongRequest;
  }
  return mongooseConnection.model('SongRequest', songRequestSchema);
}; 