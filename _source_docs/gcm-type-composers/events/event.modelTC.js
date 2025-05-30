/**
 * Event Type Composer
 * @module gcm-type-composers/events/event.modelTC
 */

import { schemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import { Event } from '../../domain-models/events/index.js';
import { TICKET_TYPE_ENUM } from '../../domain-models/config/ticket.constants.js';

// Create the Location type
const LocationTC = schemaComposer.createObjectTC({
  name: 'EventLocation',
  fields: {
    name: 'String!',
    address: 'String!',
    city: 'String!',
    state: 'String',
    country: 'String!',
    postalCode: 'String',
    coordinates: {
      type: schemaComposer.createObjectTC({
        name: 'Coordinates',
        fields: {
          latitude: 'Float',
          longitude: 'Float'
        }
      })
    }
  }
});

// Create the Capacity type
const CapacityTC = schemaComposer.createObjectTC({
  name: 'EventCapacity',
  fields: {
    total: 'Int!',
    reserved: 'Int!',
    confirmed: 'Int!',
    available: {
      type: 'Int!',
      resolve: source => source.total - source.reserved
    }
  }
});

// Create the Event TypeComposer
export const EventTC = composeWithMongoose(Event, {
  name: 'Event',
  description: 'An event that can be attended by users',
  fields: {
    remove: ['__v'],
    override: {
      location: {
        type: LocationTC
      },
      capacity: {
        type: CapacityTC
      }
    }
  }
});

// Add computed fields
EventTC.addFields({
  isStarted: {
    type: 'Boolean!',
    description: 'Whether the event has started',
    resolve: source => Date.now() >= source.startDate
  },
  isEnded: {
    type: 'Boolean!',
    description: 'Whether the event has ended',
    resolve: source => Date.now() >= source.endDate
  },
  availableCapacity: {
    type: 'Int!',
    description: 'Number of available spots',
    resolve: source => source.capacity.total - source.capacity.reserved
  },
  ticketStats: {
    type: schemaComposer.createObjectTC({
      name: 'EventTicketStats',
      fields: {
        total: 'Int!',
        pending: 'Int!',
        purchased: 'Int!',
        used: 'Int!',
        cancelled: 'Int!',
        expired: 'Int!'
      }
    }),
    description: 'Ticket statistics for the event',
    resolve: source => {
      const stats = {
        total: source.tickets.length,
        pending: 0,
        purchased: 0,
        used: 0,
        cancelled: 0,
        expired: 0
      };
      
      source.tickets.forEach(ticket => {
        stats[ticket.status]++;
      });
      
      return stats;
    }
  }
});

// Add field resolvers
EventTC.addResolver({
  name: 'canIssueTickets',
  type: 'Boolean!',
  description: 'Check if tickets can be issued for this event',
  resolve: ({ source }) => {
    return source.status === 'published' && 
           !source.isEnded && 
           source.availableCapacity > 0;
  }
});

EventTC.addResolver({
  name: 'getTicketPrice',
  type: 'Float',
  args: {
    type: `enum TicketType { ${TICKET_TYPE_ENUM.join('\n')} }`
  },
  resolve: ({ source, args }) => {
    const ticketType = source.ticketTypes.find(t => t.type === args.type);
    return ticketType ? ticketType.creditCost : null;
  }
});

export { EventTC }; 