import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const requestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['song', 'event', 'feature'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending', required: true },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    priority: { type: Number, default: 0 },
    metadata: { type: Object }
  });

  requestSchema.plugin(cleanToJSON);
  requestSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => requestSchema.plugin(plugin));

  if (mongooseConnection.models.Request) {
    return mongooseConnection.models.Request;
  }
  return mongooseConnection.model('Request', requestSchema);
}; 