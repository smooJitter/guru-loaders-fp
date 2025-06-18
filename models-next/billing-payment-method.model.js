import cleanToJSON from './lib/plugins/cleanToJSON.js';
import timestampsPlugin from './lib/plugins/timestamps.js';

export default (context) => {
  const { mongooseConnection, additionalPlugins = [] } = context;
  const { Schema } = mongooseConnection;

  const paymentMethodSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripePaymentMethodId: { type: String, required: true, unique: true, select: false },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    paymentMethodType: { type: String, enum: ['credit card', 'paypal'], required: true }
  });

  paymentMethodSchema.index({ userId: 1, isDefault: 1 });

  paymentMethodSchema.plugin(cleanToJSON);
  paymentMethodSchema.plugin(timestampsPlugin);
  additionalPlugins.forEach(plugin => paymentMethodSchema.plugin(plugin));

  if (mongooseConnection.models.PaymentMethod) {
    return mongooseConnection.models.PaymentMethod;
  }
  return mongooseConnection.model('PaymentMethod', paymentMethodSchema);
}; 