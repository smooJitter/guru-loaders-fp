import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';

const { Schema, model } = mongoose;

const paymentMethodSchema = new Schema({
  userId:                 { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stripePaymentMethodId: { type: String,                                 required: true, unique: true, select: false },
  isDefault:             { type: Boolean, default: false },
  createdAt:             { type: Date,    default: Date.now }
});

paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.plugin(cleanToJSON);
paymentMethodSchema.plugin(timestampsPlugin);

export default model('PaymentMethod', paymentMethodSchema); 