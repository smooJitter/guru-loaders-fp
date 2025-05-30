/**
 * Event Service
 * Handles core event operations and business logic
 * @module domain-services/events/event.service
 */

import { ValidationError } from '../../lib/errors.js';
import { validateEventDates } from './lib/validators.js';
import { hasAvailableCapacity } from './lib/helpers.js';
import { EVENT_STATUS } from './lib/constants.js';
import { eventEvents } from './lib/events.js';
import { findOneInTenant, createInTenant, updateDocument, listInTenant } from './lib/model-ops.js';

/**
 * Create a new event
 * @param {Object} eventData - Event creation data
 * @param {Object} context - Operation context
 * @returns {Promise<Event>} Created event
 */
export const createEvent = async (eventData, context) => {
  validateEventDates(eventData.startDate, eventData.endDate);
  
  const event = await createInTenant(context, 'Event', eventData);
  await eventEvents.created(context, { eventId: event._id });
  
  return event;
};

/**
 * Update an existing event
 * @param {string} eventId - Event ID
 * @param {Object} updateData - Update data
 * @param {Object} context - Operation context
 * @returns {Promise<Event>} Updated event
 */
export const updateEvent = async (eventId, updateData, context) => {
  const event = await findOneInTenant(context, 'Event', { _id: eventId });

  if (updateData.startDate || updateData.endDate) {
    validateEventDates(
      updateData.startDate || event.startDate,
      updateData.endDate || event.endDate
    );
  }

  await updateDocument(context, event, updateData);
  await eventEvents.updated(context, { eventId: event._id });

  return event;
};

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @param {Object} context - Operation context
 * @returns {Promise<Event>} Event
 */
export const getEventById = async (eventId, context) => {
  return findOneInTenant(context, 'Event', { _id: eventId });
};

/**
 * List events with filtering and pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - List options (pagination, sorting)
 * @param {Object} context - Operation context
 * @returns {Promise<{events: Event[], total: number}>}
 */
export const listEvents = async (filter = {}, options = {}, context) => {
  const { items: events, total } = await listInTenant(context, 'Event', filter, options);
  return { events, total };
};

/**
 * Update event status
 * @param {string} eventId - Event ID
 * @param {string} status - New status
 * @param {Object} context - Operation context
 * @returns {Promise<Event>} Updated event
 */
export const updateEventStatus = async (eventId, status, context) => {
  const event = await getEventById(eventId, context);

  if (!event.canTransitionTo(status)) {
    throw new ValidationError(`Cannot transition event from ${event.status} to ${status}`);
  }

  const oldStatus = event.status;
  await updateDocument(context, event, { status });
  
  await eventEvents.statusChanged(context, {
    eventId: event._id,
    oldStatus,
    newStatus: status
  });

  return event;
};

/**
 * Check if event has available capacity
 * @param {string} eventId - Event ID
 * @param {number} quantity - Number of spots needed
 * @param {Object} context - Operation context
 * @returns {Promise<boolean>}
 */
export const checkAvailableCapacity = async (eventId, quantity = 1, context) => {
  const event = await getEventById(eventId, context);
  return hasAvailableCapacity(event, quantity);
};

/**
 * Reserve capacity for an event
 * @param {string} eventId - Event ID
 * @param {number} quantity - Number of spots to reserve
 * @param {Object} context - Operation context
 * @returns {Promise<Event>}
 */
export const reserveCapacity = async (eventId, quantity = 1, context) => {
  const event = await getEventById(eventId, context);

  if (!hasAvailableCapacity(event, quantity)) {
    throw new ValidationError('Insufficient capacity');
  }

  await updateDocument(context, event, {
    'capacity.reserved': event.capacity.reserved + quantity
  });

  await eventEvents.capacityUpdated(context, {
    eventId: event._id,
    capacity: event.capacity
  });

  return event;
};

/**
 * Release reserved capacity
 * @param {string} eventId - Event ID
 * @param {number} quantity - Number of spots to release
 * @param {Object} context - Operation context
 * @returns {Promise<Event>}
 */
export const releaseCapacity = async (eventId, quantity = 1, context) => {
  const event = await getEventById(eventId, context);

  await updateDocument(context, event, {
    'capacity.reserved': Math.max(0, event.capacity.reserved - quantity)
  });

  await eventEvents.capacityUpdated(context, {
    eventId: event._id,
    capacity: event.capacity
  });

  return event;
}; 