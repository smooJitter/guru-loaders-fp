/**
 * QR Code Mutation Resolvers
 * @module gcm-resolvers/events/qr.resolverMutation
 */

import { schemaComposer } from 'graphql-compose';
import { isAuthenticated, hasRole, belongsToTenant } from '../../lib/guards.js';
import { qrService } from '../../services/index.js';

// Custom resolvers with domain logic
const customResolvers = {
  // Generate QR code for ticket
  generateTicketQR: {
    type: 'JSON',
    args: {
      ticketId: 'ID!',
    },
    resolve: async (_, args, context) => {
      const ticket = await context.services.ticket.getTicketById(args.ticketId);
      return qrService.generateQRPayload(
        ticket._id,
        ticket.eventId,
        ticket.userId
      );
    },
  },

  // Process QR code entry
  processQREntry: {
    type: 'JSON',
    args: {
      qrData: 'JSON!',
      location: 'String',
    },
    resolve: async (_, args, context) => {
      return qrService.processQREntry(args.qrData, {
        ...context,
        location: args.location
      });
    },
  },

  // Validate QR code
  validateQRCode: {
    type: 'JSON',
    args: {
      qrData: 'JSON!',
    },
    resolve: async (_, args, context) => {
      return qrService.validateQRPayload(args.qrData);
    },
  },
};

// Protected resolvers with guards
const protectedResolvers = {
  generateTicketQR: customResolvers.generateTicketQR.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  processQREntry: customResolvers.processQREntry.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),

  validateQRCode: customResolvers.validateQRCode.wrapResolve(next => async (rp) => {
    await isAuthenticated(rp);
    await hasRole(['admin', 'organizer', 'staff'])(rp);
    await belongsToTenant(rp);
    return next(rp);
  }),
};

// Add to schema
Object.entries(protectedResolvers).forEach(([name, resolver]) => {
  schemaComposer.Mutation.addFields({ [name]: resolver });
}); 