import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import statusTrackableWithMetaPlugin from './lib/plugins/statusTrackableWithMeta.js';
import { MetadataSchema } from './schemas/metadata.schema.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  // Define the schema
  const transactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
    relatedInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    createdAt: { type: Date, default: Date.now },
    transactionId: { type: String, required: true, unique: true },
    metadata: MetadataSchema
  });

  // Plugins
  transactionSchema.plugin(cleanToJSON);
  transactionSchema.plugin(timestampsPlugin);
  transactionSchema.plugin(statusTrackableWithMetaPlugin, {
    enum: ['pending', 'completed', 'failed'],
    trackHistory: true
  });
  additionalPlugins.forEach(plugin => transactionSchema.plugin(plugin));

  // Prevent duplicate model registration
  if (mongooseConnection.models.Transaction) {
    return mongooseConnection.models.Transaction;
  }

  // Register and return the model using the provided mongoose connection
  return mongooseConnection.model('Transaction', transactionSchema);
}; 