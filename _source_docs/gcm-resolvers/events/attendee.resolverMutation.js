import { schemaComposer } from 'graphql-compose';
import { AttendeeTC } from '../../models-tc/events/attendee.modelTC.js';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { attendeeService } from '../../services/index.js';

// Default resolvers from graphql-compose-mongoose
const defaultResolvers = {
  attendeeCreateOne: AttendeeTC.mongooseResolvers.createOne(),
  attendeeUpdateById: AttendeeTC.mongooseResolvers.updateById(),
  attendeeRemoveById: AttendeeTC.mongooseResolvers.removeById(),
};

// Custom resolvers with domain logic
const customResolvers = {
  checkInAttendee: {
    type: AttendeeTC,
    args: {
      eventId: 'ID!',
      userId: 'ID!',
      method: {
        type: 'String',
        defaultValue: 'qr',
      },
      location: 'String',
    },
    resolve: async (_, args, context) => {
      return attendeeService.checkInAttendee(args.eventId, args.userId, {
        method: args.method,
        location: args.location,
        processedBy: context.user.id,
      }, context);
    },
  },

  checkOutAttendee: {
    type: AttendeeTC,
    args: {
      eventId: 'ID!',
      userId: 'ID!',
      method: {
        type: 'String',
        defaultValue: 'qr',
      },
      location: 'String',
    },
    resolve: async (_, args, context) => {
      return attendeeService.checkOutAttendee(args.eventId, args.userId, {
        method: args.method,
        location: args.location,
        processedBy: context.user.id,
      }, context);
    },
  },

  markAttendeeNoShow: {
    type: AttendeeTC,
    args: {
      eventId: 'ID!',
      userId: 'ID!',
    },
    resolve: async (_, args, context) => {
      return attendeeService.markAttendeeNoShow(args.eventId, args.userId, context);
    },
  },

  updateAttendeePreferences: {
    type: AttendeeTC,
    args: {
      eventId: 'ID!',
      preferences: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return attendeeService.updateAttendeePreferences(args.eventId, context.user.id, args.preferences, context);
    },
  },

  bulkCheckIn: {
    type: ['JSON'],
    args: {
      eventId: 'ID!',
      userIds: '[ID!]!',
      method: {
        type: 'String',
        defaultValue: 'manual',
      },
      location: 'String',
    },
    resolve: async (_, args, context) => {
      return attendeeService.bulkCheckIn(args.eventId, args.userIds, {
        method: args.method,
        location: args.location,
        processedBy: context.user.id,
      }, context);
    },
  },

  // Advanced check-in features
  validateCheckIn: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      token: 'String!',
    },
    resolve: async (_, args, context) => {
      return attendeeService.validateCheckInToken(args.eventId, args.token, context);
    },
  },

  generateCheckInPass: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      userId: 'ID!',
      format: {
        type: 'String',
        defaultValue: 'qr',
      },
    },
    resolve: async (_, args, context) => {
      return attendeeService.generateCheckInPass(args.eventId, args.userId, args.format, context);
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  checkInAttendee: customResolvers.checkInAttendee.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  checkOutAttendee: customResolvers.checkOutAttendee.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  markAttendeeNoShow: customResolvers.markAttendeeNoShow.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  updateAttendeePreferences: customResolvers.updateAttendeePreferences.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),

  bulkCheckIn: customResolvers.bulkCheckIn.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // Advanced check-in feature guards
  validateCheckIn: customResolvers.validateCheckIn.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  generateCheckInPass: customResolvers.generateCheckInPass.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
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