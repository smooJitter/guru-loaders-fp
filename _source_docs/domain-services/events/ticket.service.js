/**
 * Ticket Service
 * Handles ticket operations and credit integration
 * @module domain-services/events/ticket.service
 */

import { ValidationError } from '../../lib/errors.js';
import { validateTicketReservation } from './lib/validators.js';
import { 
  hasAvailableCapacity,
  findTicketsByIds,
  calculateTotalCost,
  createTicketReservation
} from './lib/helpers.js';
import { TICKET_STATUS, RESERVATION_EXPIRY_MS } from './lib/constants.js';
import { ticketEvents } from './lib/events.js';
import { getEventById } from './event.service.js';
import { updateDocument } from './lib/model-ops.js';

/**
 * Reserve tickets for an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} ticketType - Type of ticket
 * @param {number} quantity - Number of tickets
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Reserved tickets
 */
export const reserveTickets = async (eventId, userId, ticketType, quantity = 1, context) => {
  const event = await getEventById(eventId, context);

  // Validate ticket type exists
  const ticketConfig = event.ticketTypes.find(t => t.type === ticketType);
  validateTicketReservation(ticketConfig, quantity);

  // Check event capacity
  if (!hasAvailableCapacity(event, quantity)) {
    throw new ValidationError('Insufficient event capacity');
  }

  // Create ticket reservations
  const tickets = Array(quantity).fill().map(() => 
    createTicketReservation(eventId, userId, ticketType, ticketConfig.creditCost)
  );

  // Add tickets and update capacity
  await updateDocument(context, event, {
    tickets: [...event.tickets, ...tickets],
    'capacity.reserved': event.capacity.reserved + quantity
  });

  await ticketEvents.reserved(context, {
    eventId,
    userId,
    quantity,
    ticketType
  });

  return tickets;
};

/**
 * Purchase reserved tickets
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Array<string>} ticketIds - IDs of tickets to purchase
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Purchased tickets
 */
export const purchaseTickets = async (eventId, userId, ticketIds, context) => {
  const event = await getEventById(eventId, context);

  // Find reserved tickets
  const tickets = findTicketsByIds(event, ticketIds, userId, TICKET_STATUS.PENDING);
  if (tickets.length !== ticketIds.length) {
    throw new ValidationError('One or more tickets are invalid or already purchased');
  }

  // Calculate total cost
  const totalCost = calculateTotalCost(tickets);

  // Process credit transaction
  const transaction = await context.services.credits.deductCredits(userId, totalCost, {
    type: 'ticket_purchase',
    eventId: event._id,
    ticketIds
  });

  // Update tickets
  tickets.forEach(ticket => {
    ticket.status = TICKET_STATUS.PURCHASED;
    ticket.purchase = {
      purchasedAt: new Date(),
      creditAmount: ticket.creditCost,
      transactionId: transaction._id
    };
  });

  await updateDocument(context, event, {
    tickets: event.tickets
  });

  await ticketEvents.purchased(context, {
    eventId,
    userId,
    ticketIds,
    totalCost
  });

  return tickets;
};

/**
 * Cancel tickets
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Array<string>} ticketIds - IDs of tickets to cancel
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Cancelled tickets
 */
export const cancelTickets = async (eventId, userId, ticketIds, context) => {
  const event = await getEventById(eventId, context);

  // Find purchased tickets
  const tickets = findTicketsByIds(event, ticketIds, userId, TICKET_STATUS.PURCHASED);
  if (tickets.length !== ticketIds.length) {
    throw new ValidationError('One or more tickets are invalid or already cancelled');
  }

  // Calculate refund amount
  const refundAmount = calculateTotalCost(tickets);

  // Process credit refund
  await context.services.credits.addCredits(userId, refundAmount, {
    type: 'ticket_refund',
    eventId: event._id,
    ticketIds
  });

  // Update tickets
  tickets.forEach(ticket => {
    ticket.status = TICKET_STATUS.CANCELLED;
  });

  await updateDocument(context, event, {
    tickets: event.tickets,
    'capacity.reserved': event.capacity.reserved - tickets.length
  });

  await ticketEvents.cancelled(context, {
    eventId,
    userId,
    ticketIds,
    refundAmount
  });

  return tickets;
};

/**
 * Use a ticket for event entry
 * @param {string} eventId - Event ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} usageData - Usage details
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Used ticket
 */
export const useTicket = async (eventId, ticketId, usageData, context) => {
  const event = await getEventById(eventId, context);

  // Find ticket
  const ticket = event.tickets.find(t => 
    t._id.toString() === ticketId &&
    t.status === TICKET_STATUS.PURCHASED
  );

  if (!ticket) {
    throw new ValidationError('Invalid or already used ticket');
  }

  // Update ticket
  ticket.status = TICKET_STATUS.USED;
  ticket.usage = {
    usedAt: new Date(),
    ...usageData
  };

  await updateDocument(context, event, {
    tickets: event.tickets,
    'capacity.confirmed': event.capacity.confirmed + 1,
    'capacity.reserved': event.capacity.reserved - 1
  });

  await ticketEvents.used(context, {
    eventId,
    ticketId,
    usageData
  });

  return ticket;
};

/**
 * Get ticket details
 * @param {string} eventId - Event ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Ticket details
 */
export const getTicketDetails = async (eventId, ticketId, context) => {
  const event = await getEventById(eventId, context);

  const ticket = event.tickets.find(t => t._id.toString() === ticketId);
  if (!ticket) {
    throw new ValidationError('Ticket not found');
  }

  return ticket;
};

/**
 * List tickets for an event
 * @param {string} eventId - Event ID
 * @param {Object} filter - Filter criteria
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} List of tickets
 */
export const listEventTickets = async (eventId, filter = {}, context) => {
  const event = await getEventById(eventId, context);
  return filterTickets(event.tickets, filter);
};

/**
 * Get ticket sales velocity metrics
 * @param {string} eventId - Event ID
 * @param {string} timeframe - Time period for analysis
 * @param {string} ticketType - Optional ticket type filter
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Sales velocity metrics
 */
export const getTicketSalesVelocity = async (eventId, timeframe, ticketType, context) => {
  const event = await getEventById(eventId, context);
  const metrics = await context.services.analytics.getSalesVelocity(event, timeframe, ticketType);
  return metrics;
};

/**
 * Get dynamic pricing suggestions
 * @param {string} eventId - Event ID
 * @param {string} ticketType - Ticket type
 * @param {Array<string>} factors - Pricing factors to consider
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Pricing suggestions
 */
export const getTicketPricingSuggestions = async (eventId, ticketType, factors, context) => {
  const event = await getEventById(eventId, context);
  const suggestions = await context.services.pricing.getSuggestions(event, ticketType, factors);
  return suggestions;
};

/**
 * Get ticket holder demographics
 * @param {string} eventId - Event ID
 * @param {Array<string>} segments - Demographic segments to analyze
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Demographic data
 */
export const getTicketHolderDemographics = async (eventId, segments, context) => {
  const event = await getEventById(eventId, context);
  const demographics = await context.services.analytics.getTicketHolderDemographics(event, segments);
  return demographics;
};

/**
 * Get ticket resale market analysis
 * @param {string} eventId - Event ID
 * @param {string} ticketType - Optional ticket type filter
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Resale market data
 */
export const getTicketResaleAnalysis = async (eventId, ticketType, context) => {
  const event = await getEventById(eventId, context);
  const analysis = await context.services.market.getResaleAnalysis(event, ticketType);
  return analysis;
};

/**
 * Get ticket fraud risk assessment
 * @param {string} ticketId - Ticket ID
 * @param {Array<string>} checkTypes - Types of fraud checks to perform
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Fraud risk assessment
 */
export const getTicketFraudRisk = async (ticketId, checkTypes, context) => {
  const assessment = await context.services.security.assessFraudRisk(ticketId, checkTypes);
  return assessment;
};

/**
 * Get ticket upgrade options
 * @param {string} ticketId - Ticket ID
 * @param {Object} preferences - Upgrade preferences
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Available upgrade options
 */
export const getTicketUpgradeOptions = async (ticketId, preferences, context) => {
  const options = await context.services.ticketing.getUpgradeOptions(ticketId, preferences);
  return options;
};

/**
 * Get group booking analysis
 * @param {string} eventId - Event ID
 * @param {number} minGroupSize - Minimum group size
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Group booking analysis
 */
export const getGroupBookingAnalysis = async (eventId, minGroupSize, context) => {
  const event = await getEventById(eventId, context);
  const analysis = await context.services.analytics.getGroupBookingAnalysis(event, minGroupSize);
  return analysis;
};

/**
 * Update dynamic pricing rules
 * @param {string} eventId - Event ID
 * @param {Object} pricingRules - New pricing rules
 * @param {string} effectiveFrom - When rules take effect
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Updated tickets
 */
export const updateDynamicPricing = async (eventId, pricingRules, effectiveFrom, context) => {
  const event = await getEventById(eventId, context);
  const updatedTickets = await context.services.pricing.updateRules(event, pricingRules, effectiveFrom);
  return updatedTickets;
};

/**
 * Process batch ticket operations
 * @param {Array<Object>} operations - Batch operations
 * @param {Object} options - Operation options
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Operation results
 */
export const batchTicketOperations = async (operations, options, context) => {
  const results = await context.services.ticketing.processBatchOperations(operations, options);
  return results;
};

/**
 * Process ticket upgrade
 * @param {string} ticketId - Ticket ID
 * @param {string} newTicketType - Target ticket type
 * @param {Object} paymentInfo - Payment details
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Upgraded ticket
 */
export const processTicketUpgrade = async (ticketId, newTicketType, paymentInfo, context) => {
  const upgradedTicket = await context.services.ticketing.processUpgrade(ticketId, newTicketType, paymentInfo);
  return upgradedTicket;
};

/**
 * Process group booking
 * @param {string} eventId - Event ID
 * @param {number} groupSize - Size of group
 * @param {string} ticketType - Ticket type
 * @param {Object} groupDetails - Group booking details
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Group tickets
 */
export const processGroupBooking = async (eventId, groupSize, ticketType, groupDetails, context) => {
  const event = await getEventById(eventId, context);
  const tickets = await context.services.ticketing.processGroupBooking(event, groupSize, ticketType, groupDetails);
  return tickets;
};

/**
 * Manage waitlist
 * @param {string} eventId - Event ID
 * @param {string} action - Waitlist action
 * @param {Array<string>} userIds - User IDs
 * @param {string} ticketType - Optional ticket type
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Waitlist operation result
 */
export const manageWaitlist = async (eventId, action, userIds, ticketType, context) => {
  const event = await getEventById(eventId, context);
  const result = await context.services.ticketing.manageWaitlist(event, action, userIds, ticketType);
  return result;
};

/**
 * Customize VIP package
 * @param {string} ticketId - Ticket ID
 * @param {Object} customizations - Package customizations
 * @param {Array<string>} addons - Additional features
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Customized ticket
 */
export const customizeVIPPackage = async (ticketId, customizations, addons, context) => {
  const customizedTicket = await context.services.vip.customizePackage(ticketId, customizations, addons);
  return customizedTicket;
};

/**
 * Exchange ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} newEventId - Target event ID
 * @param {string} newTicketType - Optional new ticket type
 * @param {string} exchangeReason - Reason for exchange
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Exchanged ticket
 */
export const exchangeTicket = async (ticketId, newEventId, newTicketType, exchangeReason, context) => {
  const exchangedTicket = await context.services.ticketing.exchangeTicket(ticketId, newEventId, newTicketType, exchangeReason);
  return exchangedTicket;
};

/**
 * Create resale listing
 * @param {string} ticketId - Ticket ID
 * @param {number} price - Resale price
 * @param {Object} listingDetails - Additional listing details
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Resale listing
 */
export const createResaleListing = async (ticketId, price, listingDetails, context) => {
  const listing = await context.services.market.createResaleListing(ticketId, price, listingDetails);
  return listing;
};

/**
 * Manage season pass
 * @param {string} userId - User ID
 * @param {string} action - Pass action
 * @param {Object} passDetails - Pass details
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Season pass operation result
 */
export const manageSeasonPass = async (userId, action, passDetails, context) => {
  const result = await context.services.ticketing.manageSeasonPass(userId, action, passDetails);
  return result;
};

/**
 * Process ticket purchase with credits
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Array<string>} ticketIds - IDs of tickets to purchase
 * @param {Object} context - Operation context
 * @returns {Promise<Array>} Purchased tickets
 */
export const purchaseTicketsWithCredits = async (eventId, userId, ticketIds, context) => {
  const event = await getEventById(eventId, context);

  // Find reserved tickets
  const tickets = findTicketsByIds(event, ticketIds, userId, TICKET_STATUS.PENDING);
  if (tickets.length !== ticketIds.length) {
    throw new ValidationError('One or more tickets are invalid or already purchased');
  }

  // Calculate total cost
  const totalCost = calculateTotalCost(tickets);

  // Process credit transaction
  const transaction = await context.services.credits.deductCredits(userId, totalCost, {
    type: 'ticket_purchase',
    eventId: event._id,
    ticketIds
  });

  // Update tickets
  tickets.forEach(ticket => {
    ticket.status = TICKET_STATUS.PURCHASED;
    ticket.purchase = {
      purchasedAt: new Date(),
      creditAmount: ticket.creditCost,
      transactionId: transaction._id
    };
  });

  await updateDocument(context, event, {
    tickets: event.tickets
  });

  await ticketEvents.purchased(context, {
    eventId,
    userId,
    ticketIds,
    totalCost,
    paymentType: 'credits'
  });

  return tickets;
};

/**
 * Process ticket refund with credits
 * @param {string} eventId - Event ID
 * @param {string} ticketId - Ticket ID
 * @param {string} reason - Refund reason
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Refund result
 */
export const refundTicketToCredits = async (eventId, ticketId, reason, context) => {
  const event = await getEventById(eventId, context);
  const ticket = event.tickets.find(t => t._id.toString() === ticketId);

  if (!ticket || ticket.status !== TICKET_STATUS.PURCHASED) {
    throw new ValidationError('Invalid ticket or ticket not purchased');
  }

  // Process credit refund
  const refundAmount = ticket.purchase.creditAmount;
  const refund = await context.services.credits.addCredits(ticket.userId, refundAmount, {
    type: 'ticket_refund',
    eventId: event._id,
    ticketId,
    reason
  });

  // Update ticket
  ticket.status = TICKET_STATUS.REFUNDED;
  ticket.refund = {
    refundedAt: new Date(),
    creditAmount: refundAmount,
    reason,
    transactionId: refund._id
  };

  await updateDocument(context, event, {
    tickets: event.tickets
  });

  await ticketEvents.refunded(context, {
    eventId,
    ticketId,
    userId: ticket.userId,
    amount: refundAmount,
    reason
  });

  return {
    success: true,
    ticket,
    refund
  };
};

/**
 * Update ticket status after QR code usage
 * @param {string} eventId - Event ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} usageData - Usage details
 * @param {Object} context - Operation context
 * @returns {Promise<Object>} Updated ticket
 */
export const updateTicketAfterQRUse = async (eventId, ticketId, usageData, context) => {
  const event = await getEventById(eventId, context);
  const ticket = event.tickets.find(t => t._id.toString() === ticketId);

  if (!ticket) {
    throw new ValidationError('Ticket not found');
  }

  if (ticket.status !== TICKET_STATUS.PURCHASED) {
    throw new ValidationError('Ticket is not in a valid state for use');
  }

  // Check if QR code is still valid
  if (usageData.qrExpiresAt && new Date() > new Date(usageData.qrExpiresAt)) {
    throw new ValidationError('QR code has expired');
  }

  // Update ticket status
  ticket.status = TICKET_STATUS.USED;
  ticket.usage = {
    usedAt: new Date(),
    method: 'qr',
    ...usageData
  };

  await updateDocument(context, event, {
    tickets: event.tickets
  });

  await ticketEvents.used(context, {
    eventId,
    ticketId,
    userId: ticket.userId,
    usageData
  });

  return ticket;
}; 