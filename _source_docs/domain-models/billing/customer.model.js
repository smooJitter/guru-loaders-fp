import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';

const { Schema, model } = mongoose;

const customerSchema = new Schema({
  userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stripeCustomerId: { type: String,                              required: true, unique: true, select: false },
  createdAt:        { type: Date,    default: Date.now }
});

customerSchema.index({ userId: 1 }, { unique: true });
customerSchema.plugin(cleanToJSON);
customerSchema.plugin(timestampsPlugin);

export default model('Customer', customerSchema); 