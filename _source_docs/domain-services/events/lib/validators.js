/**
 * Event domain validators
 * @module domain-services/events/lib/validators
 */

import { ValidationError } from '../../../lib/errors.js';

/**
 * Validate event dates
 * @param {Date} startDate - Event start date
 * @param {Date} endDate - Event end date
 * @throws {ValidationError} If dates are invalid
 */
export const validateEventDates = (startDate, endDate) => {
  const errors = [];
  const now = new Date();

  if (!startDate) {
    errors.push('Start date is required');
  } else if (startDate < now) {
    errors.push('Start date cannot be in the past');
  }

  if (!endDate) {
    errors.push('End date is required');
  } else if (endDate <= startDate) {
    errors.push('End date must be after start date');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
};

/**
 * Validate ticket reservation
 * @param {Object} ticketConfig - Ticket type configuration
 * @param {number} quantity - Number of tickets to reserve
 * @throws {ValidationError} If reservation is invalid
 */
export const validateTicketReservation = (ticketConfig, quantity) => {
  const errors = [];

  if (!ticketConfig) {
    errors.push('Invalid ticket type');
  } else if (ticketConfig.maxQuantity && quantity > ticketConfig.maxQuantity) {
    errors.push(`Cannot reserve more than ${ticketConfig.maxQuantity} tickets`);
  }

  if (quantity < 1) {
    errors.push('Quantity must be at least 1');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
};

/**
 * Validate attendee check-in
 * @param {Object} event - Event object
 * @param {Object} attendee - Attendee object
 * @throws {ValidationError} If check-in is invalid
 */
export const validateCheckIn = (event, attendee) => {
  const errors = [];

  if (!event || event.status !== 'published') {
    errors.push('Event is not active');
  }

  if (attendee && attendee.checkIns.length > 0) {
    const lastCheckIn = attendee.checkIns[attendee.checkIns.length - 1];
    const lastCheckOut = attendee.checkOuts[attendee.checkOuts.length - 1];
    
    if (!lastCheckOut || lastCheckOut.time < lastCheckIn.time) {
      errors.push('Attendee is already checked in');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
}; 