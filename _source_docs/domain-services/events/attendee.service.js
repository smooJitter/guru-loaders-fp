/**
 * Attendee Service
 * Handles attendee operations and check-in/out functionality
 * @module domain-services/events/attendee.service
 */

import Attendee from '../../domain-models/events/attendee.model.js';
import Event from '../../domain-models/events/event.model.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';

/**
 * Create attendee record
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} preferences - Attendee preferences
 * @returns {Promise<Attendee>} Created attendee record
 */
export const createAttendee = async (eventId, userId, preferences = {}) => {
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new NotFoundError('Event not found');
  }

  // Check for existing attendee record
  const existingAttendee = await Attendee.findOne({ eventId, userId });
  if (existingAttendee) {
    throw new ValidationError('Attendee record already exists');
  }

  // Create attendee record
  const attendee = new Attendee({
    eventId,
    userId,
    preferences,
    checkIns: [],
    checkOuts: []
  });

  await attendee.save();
  return attendee;
};

/**
 * Update attendee preferences
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} preferences - Updated preferences
 * @returns {Promise<Attendee>} Updated attendee record
 */
export const updatePreferences = async (eventId, userId, preferences) => {
  const attendee = await Attendee.findOne({ eventId, userId });
  if (!attendee) {
    throw new NotFoundError('Attendee record not found');
  }

  attendee.preferences = {
    ...attendee.preferences,
    ...preferences
  };

  await attendee.save();
  return attendee;
};

/**
 * Record check-in
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} checkInData - Check-in details
 * @returns {Promise<Attendee>} Updated attendee record
 */
export const checkIn = async (eventId, userId, checkInData) => {
  const attendee = await Attendee.findOne({ eventId, userId });
  if (!attendee) {
    throw new NotFoundError('Attendee record not found');
  }

  // Validate event is active
  const event = await Event.findById(eventId);
  if (!event || event.status !== 'published') {
    throw new ValidationError('Event is not active');
  }

  // Create check-in record
  const checkIn = {
    time: new Date(),
    ...checkInData
  };

  attendee.checkIns.push(checkIn);
  await attendee.save();

  // Update event confirmed count if first check-in
  if (attendee.checkIns.length === 1) {
    event.capacity.confirmed += 1;
    await event.save();
  }

  return attendee;
};

/**
 * Record check-out
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} checkOutData - Check-out details
 * @returns {Promise<Attendee>} Updated attendee record
 */
export const checkOut = async (eventId, userId, checkOutData) => {
  const attendee = await Attendee.findOne({ eventId, userId });
  if (!attendee) {
    throw new NotFoundError('Attendee record not found');
  }

  // Validate has checked in
  if (attendee.checkIns.length === 0) {
    throw new ValidationError('Attendee has not checked in');
  }

  // Create check-out record
  const checkOut = {
    time: new Date(),
    ...checkOutData
  };

  attendee.checkOuts.push(checkOut);
  await attendee.save();

  return attendee;
};

/**
 * Get attendee record
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Attendee>} Attendee record
 */
export const getAttendee = async (eventId, userId) => {
  const attendee = await Attendee.findOne({ eventId, userId });
  if (!attendee) {
    throw new NotFoundError('Attendee record not found');
  }
  return attendee;
};

/**
 * List attendees for an event
 * @param {string} eventId - Event ID
 * @param {Object} filter - Filter criteria
 * @param {Object} options - List options
 * @returns {Promise<{attendees: Attendee[], total: number}>}
 */
export const listEventAttendees = async (eventId, filter = {}, options = {}) => {
  // Build query
  const query = { eventId, ...filter };
  
  // Apply pagination
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // Get attendees and total count
  const [attendees, total] = await Promise.all([
    Attendee.find(query).skip(skip).limit(limit),
    Attendee.countDocuments(query)
  ]);

  return { attendees, total };
};

/**
 * Get attendance statistics
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Attendance statistics
 */
export const getAttendanceStats = async (eventId) => {
  const attendees = await Attendee.find({ eventId });

  const stats = {
    total: attendees.length,
    checkedIn: 0,
    checkedOut: 0,
    current: 0
  };

  attendees.forEach(attendee => {
    if (attendee.checkIns.length > 0) {
      stats.checkedIn++;
      if (attendee.checkOuts.length < attendee.checkIns.length) {
        stats.current++;
      }
    }
    if (attendee.checkOuts.length > 0) {
      stats.checkedOut++;
    }
  });

  return stats;
}; 