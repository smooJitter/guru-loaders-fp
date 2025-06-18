import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const customerSchema = new Schema({
    userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    stripeCustomerId: { type: String, required: true, unique: true, select: false },
    createdAt:        { type: Date, default: Date.now },
    billingAddress:   { type: String }
  });

  customerSchema.index({ userId: 1 }, { unique: true });

  customerSchema.plugin(cleanToJSON);
  customerSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => customerSchema.plugin(plugin));

  if (mongooseConnection.models.Customer) {
    return mongooseConnection.models.Customer;
  }
  return mongooseConnection.model('Customer', customerSchema);
}; 