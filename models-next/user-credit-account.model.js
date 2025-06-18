import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const creditAccountSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    balance: { type: Number, default: 0 }
  });

  creditAccountSchema.plugin(cleanToJSON);
  creditAccountSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => creditAccountSchema.plugin(plugin));

  if (mongooseConnection.models.CreditAccount) {
    return mongooseConnection.models.CreditAccount;
  }
  return mongooseConnection.model('CreditAccount', creditAccountSchema);
}; 