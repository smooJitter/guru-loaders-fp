import { schemaComposer } from 'graphql-compose';
import { EventTC } from '../../models-tc/events/event.modelTC.js';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { ticketService } from '../../services/index.js';

// Create Ticket Type Composer from Event subdocument
const TicketTC = EventTC.getFieldTC('tickets');

// Default resolvers
const defaultResolvers = {
  ticketById: TicketTC.mongooseResolvers.findById(),
  ticketByIds: TicketTC.mongooseResolvers.findByIds(),
  ticketOne: TicketTC.mongooseResolvers.findOne(),
  ticketMany: TicketTC.mongooseResolvers.findMany(),
  ticketCount: TicketTC.mongooseResolvers.count(),
  ticketConnection: TicketTC.mongooseResolvers.connection(),
  ticketPagination: TicketTC.mongooseResolvers.pagination(),
};

// Custom resolvers with domain logic
const customResolvers = {
  // Get user's tickets
  myTickets: {
    type: [TicketTC],
    args: {
      status: 'String',
      eventId: 'ID',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return ticketService.getUserTickets(context.user.id, args, context);
    },
  },

  // Get event tickets
  eventTickets: {
    type: [TicketTC],
    args: {
      eventId: 'ID!',
      status: 'String',
      type: 'String',
      filters: 'JSON',
    },
    resolve: async (_, args, context) => {
      return ticketService.getEventTickets(args.eventId, args, context);
    },
  },

  // Get ticket availability
  ticketAvailability: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      type: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketAvailability(args.eventId, args.type, context);
    },
  },

  // Get ticket pricing
  ticketPricing: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      type: 'String',
      quantity: 'Int',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketPricing(args.eventId, args.type, args.quantity, context);
    },
  },

  // Get ticket transfer history
  ticketTransferHistory: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketTransferHistory(args.ticketId, context);
    },
  },

  // Get ticket validation status
  ticketValidationStatus: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketValidationStatus(args.ticketId, context);
    },
  },

  // Get ticket analytics
  ticketAnalytics: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      dimensions: '[String!]!',
      metrics: '[String!]!',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketAnalytics(args.eventId, args.dimensions, args.metrics, context);
    },
  },

  // NEW ORDER WINNER QUERIES

  // Get real-time ticket sales velocity
  ticketSalesVelocity: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      timeframe: 'String',
      ticketType: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketSalesVelocity(args.eventId, args.timeframe, args.ticketType, context);
    },
  },

  // Get dynamic pricing suggestions
  ticketPricingSuggestions: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      ticketType: 'String',
      factors: '[String!]',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketPricingSuggestions(args.eventId, args.ticketType, args.factors, context);
    },
  },

  // Get ticket holder demographics
  ticketHolderDemographics: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      segments: '[String!]',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketHolderDemographics(args.eventId, args.segments, context);
    },
  },

  // Get ticket resale market analysis
  ticketResaleAnalysis: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      ticketType: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketResaleAnalysis(args.eventId, args.ticketType, context);
    },
  },

  // Get fraud risk assessment
  ticketFraudRisk: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
      checkTypes: '[String!]',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketFraudRisk(args.ticketId, args.checkTypes, context);
    },
  },

  // Get ticket upgrade opportunities
  ticketUpgradeOptions: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
      preferences: 'JSON',
    },
    resolve: async (_, args, context) => {
      return ticketService.getTicketUpgradeOptions(args.ticketId, args.preferences, context);
    },
  },

  // Get group booking analysis
  groupBookingAnalysis: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      minGroupSize: 'Int',
    },
    resolve: async (_, args, context) => {
      return ticketService.getGroupBookingAnalysis(args.eventId, args.minGroupSize, context);
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  // Basic query guards
  ticketById: defaultResolvers.ticketById.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketMany: defaultResolvers.ticketMany.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // Custom query guards
  myTickets: customResolvers.myTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    return next(rp);
  }),

  eventTickets: customResolvers.eventTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketAnalytics: customResolvers.ticketAnalytics.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketTransferHistory: customResolvers.ticketTransferHistory.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketValidationStatus: customResolvers.ticketValidationStatus.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // New query guards
  ticketSalesVelocity: customResolvers.ticketSalesVelocity.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketPricingSuggestions: customResolvers.ticketPricingSuggestions.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketHolderDemographics: customResolvers.ticketHolderDemographics.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketResaleAnalysis: customResolvers.ticketResaleAnalysis.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketFraudRisk: customResolvers.ticketFraudRisk.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  ticketUpgradeOptions: customResolvers.ticketUpgradeOptions.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  groupBookingAnalysis: customResolvers.groupBookingAnalysis.wrapResolve(next => async (rp) => {
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