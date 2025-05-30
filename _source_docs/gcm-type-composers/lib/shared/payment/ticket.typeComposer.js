/**
 * Shared Ticket Type Composers
 * @module gcm-type-composers/lib/shared/payment/ticket.typeComposer
 * @see domain-models/lib/shared_schema/payment/ticketing.schema.js
 */

import { schemaComposer } from 'graphql-compose';
import { 
  TICKET_TYPE_ENUM,
  TICKET_STATUS_ENUM,
  TICKET_STATUS_META 
} from '../../../../domain-models/config/ticket.constants.js';
import { graphqlValidationRules } from '../../../../domain-models/lib/validators/ticket.validators.js';

// Create the TicketPricing type composer
export const TicketPricingTC = schemaComposer.createObjectTC({
  name: 'TicketPricing',
  description: 'Ticket type pricing configuration',
  fields: {
    type: {
      type: `enum TicketType { ${TICKET_TYPE_ENUM.join('\n')} }`,
      description: 'Type of ticket'
    },
    creditCost: {
      type: 'Float!',
      description: 'Cost in credits'
    },
    maxQuantity: {
      type: 'Int',
      description: 'Maximum number of tickets of this type'
    },
    availableFrom: 'Date',
    availableUntil: 'Date',
    metadata: 'JSON'
  }
});

// Create the TicketPurchase type composer
export const TicketPurchaseTC = schemaComposer.createObjectTC({
  name: 'TicketPurchase',
  description: 'Ticket purchase information',
  fields: {
    purchasedAt: {
      type: 'Date!',
      description: 'When the ticket was purchased'
    },
    creditAmount: {
      type: 'Float!',
      description: 'Amount of credits spent'
    },
    transactionId: {
      type: 'MongoID!',
      description: 'Associated credit transaction'
    }
  }
});

// Create the TicketUsage type composer
export const TicketUsageTC = schemaComposer.createObjectTC({
  name: 'TicketUsage',
  description: 'Ticket usage information',
  fields: {
    usedAt: {
      type: 'Date',
      description: 'When the ticket was used'
    },
    usedBy: {
      type: 'MongoID',
      description: 'User who processed the ticket usage'
    },
    method: {
      type: 'enum TicketUsageMethod { qr manual auto }',
      description: 'Method used to process the ticket'
    },
    location: {
      type: 'String',
      description: 'Location where ticket was used'
    }
  }
});

// Add validators
[TicketPricingTC, TicketPurchaseTC, TicketUsageTC].forEach(tc => {
  tc.getInputTypeComposer().addValidator(value => {
    Object.entries(value).forEach(([key, val]) => {
      const rule = graphqlValidationRules[key];
      if (rule && !rule.validator(val)) {
        throw new Error(rule.message);
      }
    });
  });
}); 