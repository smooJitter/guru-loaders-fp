import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import { CREDIT_TRANSACTION_TYPE_ENUM } from './config/credit.constants.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const creditTransactionSchema = new Schema({
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount:      { type: Number, required: true, min: 0 },
    type:        { type: String, enum: CREDIT_TRANSACTION_TYPE_ENUM, required: true },
    referenceId: { type: String },
    description: { type: String },
    createdAt:   { type: Date,   default: Date.now },
    status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
  });

  creditTransactionSchema.index({ userId: 1, createdAt: -1 });
  creditTransactionSchema.plugin(cleanToJSON);
  creditTransactionSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => creditTransactionSchema.plugin(plugin));

  if (mongooseConnection.models.CreditTransaction) {
    return mongooseConnection.models.CreditTransaction;
  }
  return mongooseConnection.model('CreditTransaction', creditTransactionSchema);
}; 