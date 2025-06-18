import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';
import { SUBSCRIPTION_STATUS_ENUM } from './config/status.constants.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const subscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    subscriptionId: { type: String, required: true, unique: true },
    status: { type: String, enum: SUBSCRIPTION_STATUS_ENUM, default: 'active' },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false }
  });

  subscriptionSchema.index({ userId: 1 });

  subscriptionSchema.plugin(cleanToJSON);
  subscriptionSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => subscriptionSchema.plugin(plugin));

  if (mongooseConnection.models.Subscription) {
    return mongooseConnection.models.Subscription;
  }
  return mongooseConnection.model('Subscription', subscriptionSchema);
}; 