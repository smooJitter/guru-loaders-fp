/**
 * Event domain event publishing helpers
 * @module domain-services/events/lib/events
 */

import { EVENT_TOPICS, TICKET_TOPICS, ATTENDEE_TOPICS } from './constants.js';

/**
 * Publish an event domain event
 * @param {Object} context - Operation context
 * @param {string} topic - Event topic
 * @param {Object} data - Event data
 * @returns {Promise<void>}
 */
export const publishEvent = async (context, topic, data) => {
  const enrichedData = {
    ...data,
    timestamp: new Date(),
    actor: context.user?.id,
    tenant: context.tenant?.id
  };

  await context.services.pubsub.publish(topic, enrichedData);
};

/**
 * Event-specific publishers
 */
export const eventEvents = {
  created: (context, data) => publishEvent(context, EVENT_TOPICS.CREATED, data),
  updated: (context, data) => publishEvent(context, EVENT_TOPICS.UPDATED, data),
  statusChanged: (context, data) => publishEvent(context, EVENT_TOPICS.STATUS_CHANGED, data),
  capacityUpdated: (context, data) => publishEvent(context, EVENT_TOPICS.CAPACITY_UPDATED, data)
};

/**
 * Ticket-specific publishers
 */
export const ticketEvents = {
  reserved: (context, data) => publishEvent(context, TICKET_TOPICS.RESERVED, data),
  purchased: (context, data) => publishEvent(context, TICKET_TOPICS.PURCHASED, data),
  cancelled: (context, data) => publishEvent(context, TICKET_TOPICS.CANCELLED, data),
  used: (context, data) => publishEvent(context, TICKET_TOPICS.USED, data)
};

/**
 * Attendee-specific publishers
 */
export const attendeeEvents = {
  created: (context, data) => publishEvent(context, ATTENDEE_TOPICS.CREATED, data),
  preferencesUpdated: (context, data) => publishEvent(context, ATTENDEE_TOPICS.PREFERENCES_UPDATED, data),
  checkedIn: (context, data) => publishEvent(context, ATTENDEE_TOPICS.CHECKED_IN, data),
  checkedOut: (context, data) => publishEvent(context, ATTENDEE_TOPICS.CHECKED_OUT, data)
}; 