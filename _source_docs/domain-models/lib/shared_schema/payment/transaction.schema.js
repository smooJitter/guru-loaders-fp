/**
 * Base Transaction Schema
 * @module domain-models/lib/shared_schema/payment/transaction
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

const TransactionStatusSchema = new Schema({
  code: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    required: true
  },
  message: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const TransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: TransactionStatusSchema,
    required: true,
    default: () => ({
      code: 'pending'
    })
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processorData: {
    type: Map,
    of: Schema.Types.Mixed
  },
  statusHistory: [TransactionStatusSchema]
}, {
  timestamps: true
});

// Indexes
TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ entityType: 1, entityId: 1 });
TransactionSchema.index({ 'status.code': 1, createdAt: -1 });

// Methods
TransactionSchema.methods.updateStatus = function(code, message) {
  const oldStatus = this.status;
  this.status = { code, message, updatedAt: new Date() };
  this.statusHistory.push(oldStatus);
};

TransactionSchema.methods.isRefundable = function() {
  return this.status.code === 'completed' && 
         this.type === 'credit' && 
         !this.statusHistory.some(s => s.code === 'refunded');
};

export { TransactionSchema }; 