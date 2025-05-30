import { schemaComposer } from 'graphql-compose';
import { EventTC } from '../../models-tc/events/event.modelTC.js';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { eventService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  eventById: EventTC.mongooseResolvers.findById(),
  eventByIds: EventTC.mongooseResolvers.findByIds(),
  eventOne: EventTC.mongooseResolvers.findOne(),
  eventMany: EventTC.mongooseResolvers.findMany(),
  eventCount: EventTC.mongooseResolvers.count(),
  eventConnection: EventTC.mongooseResolvers.connection(),
  eventPagination: EventTC.mongooseResolvers.pagination(),
};

// Custom resolvers with domain logic
const customResolvers = {
  upcomingEvents: {
    type: [EventTC],
    args: {
      limit: 'Int',
      offset: 'Int',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return eventService.getUpcomingEvents(args, context);
    },
  },

  myEvents: {
    type: [EventTC],
    args: {
      status: 'String',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return eventService.getUserEvents(context.user.id, args, context);
    },
  },

  searchEvents: {
    type: [EventTC],
    args: {
      query: 'String!',
      location: 'String',
      startDate: 'Date',
      endDate: 'Date',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return eventService.searchEvents(args, context);
    },
  },

  eventStats: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
    },
    resolve: async (_, { eventId }, context) => {
      return eventService.getEventStats(eventId, context);
    },
  },

  // Real-time event operations
  liveEventStats: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
    },
    resolve: async (_, { eventId }, context) => {
      return eventService.getLiveEventStats(eventId, context);
    },
  },

  liveAttendeeCount: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      status: '[String!]',
    },
    resolve: async (_, args, context) => {
      return eventService.getLiveAttendeeCount(args.eventId, args.status, context);
    },
  },

  // Advanced event discovery
  recommendedEvents: {
    type: [EventTC],
    args: {
      userId: 'ID',
      preferences: 'JSON',
      location: 'JSON',
      limit: 'Int',
    },
    resolve: async (_, args, context) => {
      return eventService.getRecommendedEvents(args, context);
    },
  },

  similarEvents: {
    type: [EventTC],
    args: {
      eventId: 'ID!',
      limit: 'Int',
    },
    resolve: async (_, args, context) => {
      return eventService.getSimilarEvents(args.eventId, args.limit, context);
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  eventById: defaultResolvers.eventById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  eventMany: defaultResolvers.eventMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  eventStats: customResolvers.eventStats.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  myEvents: customResolvers.myEvents.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),

  // Real-time event operation guards
  liveEventStats: customResolvers.liveEventStats.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  liveAttendeeCount: customResolvers.liveAttendeeCount.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // Advanced event discovery guards
  recommendedEvents: customResolvers.recommendedEvents.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),

  similarEvents: customResolvers.similarEvents.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
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
  schemaComposer.Query.addFields({ [name]: resolver });
});

export default resolvers; 