import { schemaComposer } from 'graphql-compose';
import { EventTC } from '../../models-tc/events/event.modelTC.js';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { ticketService } from '../../services/index.js';

// Create Ticket Type Composer from Event subdocument
const TicketTC = EventTC.getFieldTC('tickets');

// Default resolvers
const defaultResolvers = {
  ticketCreateOne: TicketTC.mongooseResolvers.createOne(),
  ticketUpdateById: TicketTC.mongooseResolvers.updateById(),
  ticketRemoveById: TicketTC.mongooseResolvers.removeById(),
};

// Custom resolvers with domain logic
const customResolvers = {
  // Reserve tickets
  reserveTickets: {
    type: [TicketTC],
    args: {
      eventId: 'ID!',
      type: 'String!',
      quantity: 'Int!',
      preferences: 'JSON',
    },
    resolve: async (_, args, context) => {
      return ticketService.reserveTickets(args.eventId, context.user.id, args, context);
    },
  },

  // Purchase tickets
  purchaseTickets: {
    type: [TicketTC],
    args: {
      eventId: 'ID!',
      ticketIds: '[ID!]!',
      paymentMethod: 'String!',
      promoCode: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.purchaseTickets(args.eventId, context.user.id, args, context);
    },
  },

  // Cancel tickets
  cancelTickets: {
    type: [TicketTC],
    args: {
      ticketIds: '[ID!]!',
      reason: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.cancelTickets(args.ticketIds, args.reason, context);
    },
  },

  // Transfer ticket
  transferTicket: {
    type: TicketTC,
    args: {
      ticketId: 'ID!',
      toUserId: 'ID!',
      message: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.transferTicket(args.ticketId, args.toUserId, args.message, context);
    },
  },

  // Apply promo code
  applyPromoCode: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      promoCode: 'String!',
      ticketType: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.applyPromoCode(args.eventId, args.promoCode, args.ticketType, context);
    },
  },

  // Bulk operations
  bulkReserveTickets: {
    type: ['JSON'],
    args: {
      eventId: 'ID!',
      reservations: '[JSON!]!',
    },
    resolve: async (_, args, context) => {
      return ticketService.bulkReserveTickets(args.eventId, args.reservations, context);
    },
  },

  bulkCancelTickets: {
    type: ['JSON'],
    args: {
      ticketIds: '[ID!]!',
      reason: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.bulkCancelTickets(args.ticketIds, args.reason, context);
    },
  },

  // Ticket validation and check-in
  validateTicket: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
      validationType: 'String!',
    },
    resolve: async (_, args, context) => {
      return ticketService.validateTicket(args.ticketId, args.validationType, context);
    },
  },

  checkInTicket: {
    type: TicketTC,
    args: {
      ticketId: 'ID!',
      method: 'String',
      location: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.checkInTicket(args.ticketId, args, context);
    },
  },

  // NEW ORDER WINNER MUTATIONS

  // Dynamic pricing update
  updateDynamicPricing: {
    type: [TicketTC],
    args: {
      eventId: 'ID!',
      pricingRules: 'JSON!',
      effectiveFrom: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.updateDynamicPricing(args.eventId, args.pricingRules, args.effectiveFrom, context);
    },
  },

  // Batch ticket operations
  batchTicketOperations: {
    type: 'JSON',
    args: {
      operations: '[JSON!]!',
      options: 'JSON',
    },
    resolve: async (_, args, context) => {
      return ticketService.batchTicketOperations(args.operations, args.options, context);
    },
  },

  // Ticket upgrade processing
  processTicketUpgrade: {
    type: TicketTC,
    args: {
      ticketId: 'ID!',
      newTicketType: 'String!',
      paymentInfo: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return ticketService.processTicketUpgrade(args.ticketId, args.newTicketType, args.paymentInfo, context);
    },
  },

  // Group booking processing
  processGroupBooking: {
    type: [TicketTC],
    args: {
      eventId: 'ID!',
      groupSize: 'Int!',
      ticketType: 'String!',
      groupDetails: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return ticketService.processGroupBooking(args.eventId, args.groupSize, args.ticketType, args.groupDetails, context);
    },
  },

  // Waitlist management
  manageWaitlist: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      action: 'String!',
      userIds: '[ID!]!',
      ticketType: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.manageWaitlist(args.eventId, args.action, args.userIds, args.ticketType, context);
    },
  },

  // VIP package customization
  customizeVIPPackage: {
    type: TicketTC,
    args: {
      ticketId: 'ID!',
      customizations: 'JSON!',
      addons: '[String!]',
    },
    resolve: async (_, args, context) => {
      return ticketService.customizeVIPPackage(args.ticketId, args.customizations, args.addons, context);
    },
  },

  // Ticket exchange
  exchangeTicket: {
    type: TicketTC,
    args: {
      ticketId: 'ID!',
      newEventId: 'ID!',
      newTicketType: 'String',
      exchangeReason: 'String',
    },
    resolve: async (_, args, context) => {
      return ticketService.exchangeTicket(args.ticketId, args.newEventId, args.newTicketType, args.exchangeReason, context);
    },
  },

  // Ticket resale listing
  createResaleListing: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
      price: 'Float!',
      listingDetails: 'JSON',
    },
    resolve: async (_, args, context) => {
      return ticketService.createResaleListing(args.ticketId, args.price, args.listingDetails, context);
    },
  },

  // Season pass management
  manageSeasonPass: {
    type: 'JSON',
    args: {
      userId: 'ID!',
      action: 'String!',
      passDetails: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return ticketService.manageSeasonPass(args.userId, args.action, args.passDetails, context);
    },
  },

  // Purchase tickets with credits
  purchaseTicketsWithCredits: {
    type: [TicketTC],
    args: {
      eventId: 'ID!',
      ticketIds: '[ID!]!',
    },
    resolve: async (_, args, context) => {
      return ticketService.purchaseTicketsWithCredits(
        args.eventId,
        context.user.id,
        args.ticketIds,
        context
      );
    },
  },

  // Refund ticket to credits
  refundTicketToCredits: {
    type: 'JSON',
    args: {
      eventId: 'ID!',
      ticketId: 'ID!',
      reason: 'String!',
    },
    resolve: async (_, args, context) => {
      return ticketService.refundTicketToCredits(
        args.eventId,
        args.ticketId,
        args.reason,
        context
      );
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  // Basic operation guards
  reserveTickets: customResolvers.reserveTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  purchaseTickets: customResolvers.purchaseTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  cancelTickets: customResolvers.cancelTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  transferTicket: customResolvers.transferTicket.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // Bulk operation guards
  bulkReserveTickets: customResolvers.bulkReserveTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  bulkCancelTickets: customResolvers.bulkCancelTickets.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // Validation guards
  validateTicket: customResolvers.validateTicket.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  checkInTicket: customResolvers.checkInTicket.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  // New mutation guards
  updateDynamicPricing: customResolvers.updateDynamicPricing.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  batchTicketOperations: customResolvers.batchTicketOperations.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  processTicketUpgrade: customResolvers.processTicketUpgrade.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  processGroupBooking: customResolvers.processGroupBooking.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  manageWaitlist: customResolvers.manageWaitlist.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  customizeVIPPackage: customResolvers.customizeVIPPackage.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  exchangeTicket: customResolvers.exchangeTicket.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  createResaleListing: customResolvers.createResaleListing.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  manageSeasonPass: customResolvers.manageSeasonPass.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  purchaseTicketsWithCredits: customResolvers.purchaseTicketsWithCredits.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  refundTicketToCredits: customResolvers.refundTicketToCredits.wrapResolve(next => async (rp) => {
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