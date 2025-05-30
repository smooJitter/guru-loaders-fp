import { schemaComposer } from 'graphql-compose';
import { EventTC } from '../../models-tc/events/event.modelTC.js';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { eventService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  eventCreateOne: EventTC.mongooseResolvers.createOne(),
  eventUpdateById: EventTC.mongooseResolvers.updateById(),
  eventRemoveById: EventTC.mongooseResolvers.removeById(),
};

// Custom resolvers with domain logic
const customResolvers = {
  createEvent: {
    type: EventTC,
    args: {
      title: 'String!',
      description: 'String!',
      startDate: 'Date!',
      endDate: 'Date!',
      location: 'JSON!',
      capacity: 'JSON!',
      ticketTypes: '[JSON!]!',
      metadata: 'JSON',
    },
    resolve: async (_, args, context) => {
      return eventService.createEvent(args, context);
    },
  },

  updateEventStatus: {
    type: EventTC,
    args: {
      eventId: 'ID!',
      status: 'String!',
    },
    resolve: async (_, args, context) => {
      return eventService.updateEventStatus(args.eventId, args.status, context);
    },
  },

  addTicketType: {
    type: EventTC,
    args: {
      eventId: 'ID!',
      type: 'String!',
      name: 'String!',
      description: 'String',
      creditCost: 'Int!',
      maxQuantity: 'Int',
    },
    resolve: async (_, args, context) => {
      return eventService.addTicketType(args.eventId, args, context);
    },
  },

  updateTicketType: {
    type: EventTC,
    args: {
      eventId: 'ID!',
      typeId: 'ID!',
      updates: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return eventService.updateTicketType(args.eventId, args.typeId, args.updates, context);
    },
  },

  removeTicketType: {
    type: EventTC,
    args: {
      eventId: 'ID!',
      typeId: 'ID!',
    },
    resolve: async (_, args, context) => {
      return eventService.removeTicketType(args.eventId, args.typeId, context);
    },
  },

  // Enhanced event operations
  cloneEvent: {
    type: EventTC,
    args: {
      eventId: 'ID!',
      overrides: 'JSON',
    },
    resolve: async (_, args, context) => {
      return eventService.cloneEvent(args.eventId, args.overrides, context);
    },
  },

  bulkUpdateEvents: {
    type: ['JSON'],
    args: {
      eventIds: '[ID!]!',
      updates: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return eventService.bulkUpdateEvents(args.eventIds, args.updates, context);
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  createEvent: customResolvers.createEvent.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  updateEventStatus: customResolvers.updateEventStatus.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  addTicketType: customResolvers.addTicketType.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  updateTicketType: customResolvers.updateTicketType.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  removeTicketType: customResolvers.removeTicketType.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // Enhanced event operation guards
  cloneEvent: customResolvers.cloneEvent.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  bulkUpdateEvents: customResolvers.bulkUpdateEvents.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),
};

// Combine all resolvers
const resolvers = {
  ...defaultResolvers,
  ...customResolvers,
  ...protectedResolvers,
};

// Add to schema
Object.entries(resolvers).forEach(([name, resolver]) => {
  schemaComposer.Mutation.addFields({ [name]: resolver });
});

export default resolvers; 