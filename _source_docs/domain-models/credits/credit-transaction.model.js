import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';
import { CREDIT_TRANSACTION_TYPE_ENUM } from '../../config/credit.constants.js';

const { Schema, model } = mongoose;

const creditTxnSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount:      { type: Number, required: true },
  type:        { type: String, enum: CREDIT_TRANSACTION_TYPE_ENUM, required: true },
  referenceId: { type: String },
  description: { type: String },
  createdAt:   { type: Date,   default: Date.now }
});

creditTxnSchema.index({ userId: 1, createdAt: -1 });

creditTxnSchema.plugin(cleanToJSON);
creditTxnSchema.plugin(timestampsPlugin);

export default model('CreditTransaction', creditTxnSchema); 