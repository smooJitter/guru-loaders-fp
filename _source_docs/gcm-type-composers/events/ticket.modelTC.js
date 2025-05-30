/**
 * Event Ticket Type Composer
 * @module gcm-type-composers/events/ticket.modelTC
 * @see domain-models/lib/shared_schema/payment/ticketing.schema.js
 */

import { schemaComposer } from 'graphql-compose';
import { 
  TICKET_TYPE_ENUM,
  TICKET_STATUS_ENUM,
  TICKET_STATUS_META 
} from '../../domain-models/config/ticket.constants.js';
import { graphqlValidationRules } from '../../domain-models/lib/validators/ticket.validators.js';
import {
  TicketPricingTC,
  TicketPurchaseTC,
  TicketUsageTC
} from '../lib/shared/payment/ticket.typeComposer.js';

// Create the main Event Ticket type composer
export const TicketTC = schemaComposer.createObjectTC({
  name: 'EventTicket',
  description: 'Event ticket information',
  fields: {
    eventId: {
      type: 'MongoID!',
      description: 'Associated event'
    },
    userId: {
      type: 'MongoID!',
      description: 'Ticket owner'
    },
    type: {
      type: `enum TicketType { ${TICKET_TYPE_ENUM.join('\n')} }`,
      description: 'Type of ticket'
    },
    status: {
      type: `enum TicketStatus { ${TICKET_STATUS_ENUM.join('\n')} }`,
      description: 'Current ticket status'
    },
    statusMeta: {
      type: schemaComposer.createObjectTC({
        name: 'TicketStatusMeta',
        fields: {
          label: 'String!',
          description: 'String!',
          color: 'String!',
          transitionsTo: '[String!]!'
        }
      }),
      description: 'Metadata about the current status',
      resolve: source => TICKET_STATUS_META[source.status]
    },
    reservedAt: {
      type: 'Date!',
      description: 'When the ticket was initially reserved'
    },
    expiresAt: {
      type: 'Date',
      description: 'When the ticket reservation expires'
    },
    purchase: {
      type: TicketPurchaseTC,
      description: 'Purchase information if ticket was bought'
    },
    usage: {
      type: TicketUsageTC,
      description: 'Usage information if ticket was used'
    },
    isExpired: {
      type: 'Boolean!',
      description: 'Whether the ticket has expired',
      resolve: source => source.expiresAt && new Date() > source.expiresAt
    },
    canBeUsed: {
      type: 'Boolean!',
      description: 'Whether the ticket can be used for entry',
      resolve: source => 
        source.status === 'purchased' && 
        (!source.expiresAt || new Date() <= source.expiresAt)
    },
    metadata: 'JSON'
  }
});

// Add input validation
TicketTC.getInputTypeComposer().addValidator(value => {
  if (value.type && !graphqlValidationRules.type.validator(value.type)) {
    throw new Error(graphqlValidationRules.type.message);
  }
  if (value.status && !graphqlValidationRules.status.validator(value.status)) {
    throw new Error(graphqlValidationRules.status.message);
  }
}); 