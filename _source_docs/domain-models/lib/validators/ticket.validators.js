/**
 * Shared validators for ticket-related schemas
 * Used by both Mongoose models and GraphQL type composers
 * @module domain-models/lib/validators/ticket.validators
 */

import { 
  TICKET_STATUS_ENUM, 
  TICKET_TYPE_ENUM,
  TICKET_USAGE_METHOD_ENUM 
} from '../../config/ticket.constants.js';

export const ticketValidators = {
  status: {
    enum: TICKET_STATUS_ENUM,
    message: 'Invalid ticket status',
    required: true
  },
  type: {
    enum: TICKET_TYPE_ENUM,
    message: 'Invalid ticket type',
    required: true
  },
  creditCost: {
    min: [0, 'Credit cost cannot be negative'],
    required: true
  },
  maxQuantity: {
    min: [0, 'Maximum quantity cannot be negative']
  },
  usageMethod: {
    enum: TICKET_USAGE_METHOD_ENUM,
    message: 'Invalid usage method'
  }
};

export const ticketPricingValidators = {
  type: ticketValidators.type,
  creditCost: ticketValidators.creditCost,
  maxQuantity: ticketValidators.maxQuantity
};

export const ticketUsageValidators = {
  method: ticketValidators.usageMethod
};

// Shared GraphQL input validation rules
export const graphqlValidationRules = {
  status: {
    validator: value => TICKET_STATUS_ENUM.includes(value),
    message: 'Invalid ticket status'
  },
  type: {
    validator: value => TICKET_TYPE_ENUM.includes(value),
    message: 'Invalid ticket type'
  },
  creditCost: {
    validator: value => value >= 0,
    message: 'Credit cost cannot be negative'
  },
  maxQuantity: {
    validator: value => value >= 0,
    message: 'Maximum quantity cannot be negative'
  },
  usageMethod: {
    validator: value => TICKET_USAGE_METHOD_ENUM.includes(value),
    message: 'Invalid usage method'
  }
}; 