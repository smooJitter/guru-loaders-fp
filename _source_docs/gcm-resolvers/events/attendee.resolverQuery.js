import { schemaComposer } from 'graphql-compose';
import { AttendeeTC } from '../../models-tc/events/attendee.modelTC.js';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { attendeeService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  attendeeById: AttendeeTC.mongooseResolvers.findById(),
  attendeeByIds: AttendeeTC.mongooseResolvers.findByIds(),
  attendeeOne: AttendeeTC.mongooseResolvers.findOne(),
  attendeeMany: AttendeeTC.mongooseResolvers.findMany(),
  attendeeCount: AttendeeTC.mongooseResolvers.count(),
  attendeeConnection: AttendeeTC.mongooseResolvers.connection(),
  attendeePagination: AttendeeTC.mongooseResolvers.pagination(),
};

// Custom resolvers with domain logic
const customResolvers = {
  eventAttendees: {
    type: [AttendeeTC],
    args: {
      eventId: 'ID!',
      status: 'String',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return attendeeService.getEventAttendees(args.eventId, args, context);
    },
  },

  myEventAttendance: {
    type: [AttendeeTC],
    args: {
      status: 'String',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return attendeeService.getUserAttendance(context.user.id, args, context);
    },
  },

  attendeeStats: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
    },
    resolve: async (_, { eventId }, context) => {
      return attendeeService.getAttendeeStats(eventId, context);
    },
  },

  searchAttendees: {
    type: [AttendeeTC],
    args: {
      eventId: 'ID!',
      query: 'String!',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return attendeeService.searchAttendees(args.eventId, args.query, args.filters, context);
    },
  },

  // Advanced attendee analytics
  attendeeInsights: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      dimensions: '[String!]!',
      metrics: '[String!]!',
    },
    resolve: async (_, args, context) => {
      return attendeeService.getAttendeeInsights(args.eventId, args.dimensions, args.metrics, context);
    },
  },

  attendeeTrends: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      timeframe: 'String!',
      metrics: '[String!]!',
    },
    resolve: async (_, args, context) => {
      return attendeeService.getAttendeeTrends(args.eventId, args.timeframe, args.metrics, context);
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  attendeeById: defaultResolvers.attendeeById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  eventAttendees: customResolvers.eventAttendees.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  attendeeStats: customResolvers.attendeeStats.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  searchAttendees: customResolvers.searchAttendees.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  myEventAttendance: customResolvers.myEventAttendance.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),

  // Advanced analytics guards
  attendeeInsights: customResolvers.attendeeInsights.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  attendeeTrends: customResolvers.attendeeTrends.wrapResolve(next => async (rp) => {
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
  schemaComposer.Query.addFields({ [name]: resolver });
});

export default resolvers; 