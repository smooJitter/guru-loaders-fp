import mongoose from 'mongoose';
import cleanToJSON from '../../lib/plugins/cleanToJSON.js';
import timestampsPlugin from '../../lib/plugins/timestamps.js';
import { INVOICE_STATUS_ENUM } from '../../config/status.constants.js';

const { Schema, model } = mongoose;

const invoiceSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stripeInvoiceId: { type: String,                         required: true, unique: true, select: false },
  amountDue:       { type: Number,                         required: true },
  status:          { type: String, enum: INVOICE_STATUS_ENUM, default: 'open' },
  periodStart:     { type: Date },
  periodEnd:       { type: Date },
  paidAt:          { type: Date }
});

invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.plugin(cleanToJSON);
invoiceSchema.plugin(timestampsPlugin);

export default model('Invoice', invoiceSchema); 