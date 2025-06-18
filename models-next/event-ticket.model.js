import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const ticketSchema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: Object }
  });

  ticketSchema.plugin(cleanToJSON);
  ticketSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => ticketSchema.plugin(plugin));

  if (mongooseConnection.models.Ticket) {
    return mongooseConnection.models.Ticket;
  }
  return mongooseConnection.model('Ticket', ticketSchema);
}; 