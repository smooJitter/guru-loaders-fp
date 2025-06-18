import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const eventRequestSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending', required: true },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    priority: { type: Number, default: 0 },
    metadata: { type: Object }
  });

  eventRequestSchema.plugin(cleanToJSON);
  eventRequestSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => eventRequestSchema.plugin(plugin));

  if (mongooseConnection.models.EventRequest) {
    return mongooseConnection.models.EventRequest;
  }
  return mongooseConnection.model('EventRequest', eventRequestSchema);
}; 