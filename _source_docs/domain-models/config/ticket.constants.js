/**
 * Ticket constants
 * Defines enums and constants related to event tickets and purchases
 */

// Ticket status values
export const TICKET_STATUS_ENUM = [
  'pending',    // Initial state when ticket is reserved
  'purchased',  // Ticket has been paid for with credits
  'refunded',   // Credits have been refunded
  'cancelled',  // Ticket was cancelled
  'used',       // Ticket has been used for check-in
  'expired'     // Ticket reservation expired
];

// Ticket type values
export const TICKET_TYPE_ENUM = [
  'standard',   // Regular admission
  'vip',        // VIP access
  'early_bird', // Early bird special
  'group',      // Group ticket
  'comp'        // Complimentary ticket
];

// Ticket metadata
export const TICKET_STATUS_META = {
  pending: {
    label: 'Pending',
    description: 'Ticket is reserved but not yet purchased',
    color: 'yellow',
    transitionsTo: ['purchased', 'cancelled', 'expired']
  },
  purchased: {
    label: 'Purchased',
    description: 'Ticket has been purchased with credits',
    color: 'green',
    transitionsTo: ['refunded', 'used', 'cancelled']
  },
  refunded: {
    label: 'Refunded',
    description: 'Credits have been refunded',
    color: 'orange',
    transitionsTo: []
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Ticket was cancelled',
    color: 'red',
    transitionsTo: []
  },
  used: {
    label: 'Used',
    description: 'Ticket has been used for check-in',
    color: 'blue',
    transitionsTo: []
  },
  expired: {
    label: 'Expired',
    description: 'Ticket reservation expired',
    color: 'gray',
    transitionsTo: []
  }
};

// Event names for ticket-related events
export const TICKET_EVENTS = {
  TICKET_RESERVED: 'ticket.reserved',
  TICKET_PURCHASED: 'ticket.purchased',
  TICKET_REFUNDED: 'ticket.refunded',
  TICKET_CANCELLED: 'ticket.cancelled',
  TICKET_USED: 'ticket.used',
  TICKET_EXPIRED: 'ticket.expired'
};

// Error messages
export const TICKET_ERRORS = {
  INSUFFICIENT_CREDITS: 'Insufficient credits to purchase ticket',
  TICKET_NOT_FOUND: (id) => `Ticket not found with id: ${id}`,
  INVALID_STATUS: 'Invalid ticket status for this operation',
  TICKET_EXPIRED: 'Ticket reservation has expired',
  TICKET_ALREADY_USED: 'Ticket has already been used',
  EVENT_FULL: 'Event has reached capacity',
  DUPLICATE_TICKET: 'User already has a ticket for this event',
  MAX_TICKETS_REACHED: 'Maximum tickets per user reached',
  INVALID_TICKET_TYPE: 'Invalid ticket type',
  TICKET_TYPE_NOT_AVAILABLE: 'Ticket type not available',
  NOT_TICKET_OWNER: 'User does not own this ticket'
};

// Default values
export const TICKET_DEFAULTS = {
  RESERVATION_TIMEOUT: 15 * 60 * 1000, // 15 minutes in milliseconds
  STANDARD_TICKET_CREDITS: 1,
  VIP_TICKET_CREDITS: 3,
  MAX_TICKETS_PER_USER: 5
}; 