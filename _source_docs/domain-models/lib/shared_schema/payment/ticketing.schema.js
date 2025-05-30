/**
 * Shared Ticketing Schema
 * Reusable schema for event ticketing with credit integration
 * @module domain-models/lib/shared_schema/ticketing.schema
 * @see gcm-type-composers/events/ticket.modelTC.js
 */
import mongoose from 'mongoose';
import { 
  TICKET_STATUS_ENUM, 
  TICKET_TYPE_ENUM
} from '../../config/ticket.constants.js';
import {
  ticketValidators,
  ticketPricingValidators,
  ticketUsageValidators
} from '../validators/ticket.validators.js';

const { Schema } = mongoose;

// Ticket pricing schema
const TicketPricingSchema = new Schema({
  type: {
    type: String,
    ...ticketPricingValidators.type
  },
  creditCost: {
    type: Number,
    ...ticketPricingValidators.creditCost
  },
  maxQuantity: {
    type: Number,
    ...ticketPricingValidators.maxQuantity
  },
  availableFrom: Date,
  availableUntil: Date,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false, timestamps: false });

// Ticket purchase schema
const TicketPurchaseSchema = new Schema({
  purchasedAt: {
    type: Date,
    required: true
  },
  creditAmount: {
    type: Number,
    ...ticketValidators.creditCost
  },
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'CreditTransaction'
  }
}, { _id: false, timestamps: false });

// Ticket usage schema
const TicketUsageSchema = new Schema({
  usedAt: Date,
  usedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  method: {
    type: String,
    ...ticketUsageValidators.method,
    default: 'qr'
  },
  location: String
}, { _id: false, timestamps: false });

// Main ticket schema
const TicketSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    ...ticketValidators.type
  },
  status: {
    type: String,
    ...ticketValidators.status,
    default: 'pending',
    index: true
  },
  reservedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: Date,
  purchase: TicketPurchaseSchema,
  usage: TicketUsageSchema,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, { 
  _id: false, 
  timestamps: false 
});

// Add compound indexes
TicketSchema.index({ eventId: 1, userId: 1 });
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ userId: 1, status: 1 });

// Export schemas
export {
  TicketPricingSchema,
  TicketPurchaseSchema,
  TicketUsageSchema,
  TicketSchema
}; 