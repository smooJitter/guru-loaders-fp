/**
 * Event domain helpers
 * @module domain-services/events/lib/helpers
 */

/**
 * Calculate available capacity
 * @param {Object} event - Event object
 * @returns {number} Available capacity
 */
export const calculateAvailableCapacity = (event) => {
  return event.capacity.total - event.capacity.reserved;
};

/**
 * Check if event has sufficient capacity
 * @param {Object} event - Event object
 * @param {number} quantity - Requested quantity
 * @returns {boolean} Whether capacity is available
 */
export const hasAvailableCapacity = (event, quantity = 1) => {
  return calculateAvailableCapacity(event) >= quantity;
};

/**
 * Find ticket by ID in event
 * @param {Object} event - Event object
 * @param {string} ticketId - Ticket ID
 * @returns {Object|null} Found ticket or null
 */
export const findTicketById = (event, ticketId) => {
  return event.tickets.find(t => t._id.toString() === ticketId);
};

/**
 * Find tickets by IDs and user
 * @param {Object} event - Event object
 * @param {string[]} ticketIds - Array of ticket IDs
 * @param {string} userId - User ID
 * @param {string} status - Required ticket status
 * @returns {Object[]} Found tickets
 */
export const findTicketsByIds = (event, ticketIds, userId, status) => {
  return event.tickets.filter(t => 
    ticketIds.includes(t._id.toString()) &&
    t.userId.toString() === userId &&
    t.status === status
  );
};

/**
 * Calculate total credit cost for tickets
 * @param {Object[]} tickets - Array of tickets
 * @returns {number} Total credit cost
 */
export const calculateTotalCost = (tickets) => {
  return tickets.reduce((sum, t) => sum + t.creditCost, 0);
};

/**
 * Create ticket reservation object
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} ticketType - Ticket type
 * @param {number} creditCost - Credit cost
 * @returns {Object} Ticket reservation
 */
export const createTicketReservation = (eventId, userId, ticketType, creditCost) => ({
  eventId,
  userId,
  type: ticketType,
  status: 'pending',
  reservedAt: new Date(),
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  creditCost
});

/**
 * Filter tickets by criteria
 * @param {Object[]} tickets - Array of tickets
 * @param {Object} filter - Filter criteria
 * @returns {Object[]} Filtered tickets
 */
export const filterTickets = (tickets, filter = {}) => {
  let filtered = [...tickets];

  if (filter.status) {
    filtered = filtered.filter(t => t.status === filter.status);
  }
  if (filter.type) {
    filtered = filtered.filter(t => t.type === filter.type);
  }
  if (filter.userId) {
    filtered = filtered.filter(t => t.userId.toString() === filter.userId);
  }

  return filtered;
};

/**
 * Calculate attendance statistics
 * @param {Object[]} attendees - Array of attendees
 * @returns {Object} Attendance statistics
 */
export const calculateAttendanceStats = (attendees) => {
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