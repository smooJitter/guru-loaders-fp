import timestampsPlugin from './plugins/mongoose-timestamps.plugin.js';
import cleanToJSON from './plugins/cleanToJSON.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const songRequestSchema = new Schema({
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
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