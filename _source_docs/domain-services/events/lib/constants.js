/**
 * Event domain constants
 * @module domain-services/events/lib/constants
 */

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export const TICKET_STATUS = {
  PENDING: 'pending',
  PURCHASED: 'purchased',
  CANCELLED: 'cancelled',
  USED: 'used'
};

export const EVENT_TOPICS = {
  CREATED: 'event.created',
  UPDATED: 'event.updated',
  STATUS_CHANGED: 'event.status.updated',
  CAPACITY_UPDATED: 'event.capacity.updated'
};

export const TICKET_TOPICS = {
  RESERVED: 'tickets.reserved',
  PURCHASED: 'tickets.purchased',
  CANCELLED: 'tickets.cancelled',
  USED: 'tickets.used'
};

export const ATTENDEE_TOPICS = {
  CREATED: 'attendee.created',
  PREFERENCES_UPDATED: 'attendee.preferences.updated',
  CHECKED_IN: 'attendee.checked.in',
  CHECKED_OUT: 'attendee.checked.out'
};

// Freeze objects to prevent modification
Object.freeze(EVENT_STATUS);
Object.freeze(TICKET_STATUS);
Object.freeze(EVENT_TOPICS);
Object.freeze(TICKET_TOPICS);
Object.freeze(ATTENDEE_TOPICS);

export const RESERVATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes 