// Shared utilities for action modules
// - makeErrors: error message factory
// - requireFound: throws if entity is not found
// - safeEmit: safely emits events if emitter exists

// Error factory for consistent error messages
export const makeErrors = (entity) => ({
  NOT_FOUND: (id) => `${entity} not found with id: ${id}`,
  INVALID_INPUT: 'Invalid input',
  INVALID_STATUS: 'Invalid status',
  INVALID_RATING: 'Rating must be between 1 and 5',
  DUPLICATE_REQUEST: 'You already have a pending request',
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  REQUEST_NOT_FOUND: (id) => `Request not found with id: ${id}`,
  INVALID_REQUEST_STATUS: 'Invalid request status for this operation',
});

// Throws if entity is falsy, otherwise returns it
export const requireFound = (entity, error) => {
  if (!entity) throw new Error(error);
  return entity;
};

// Safely emits an event if emitter exists
export const safeEmit = async (events, ...args) => {
  if (events && typeof events.emit === 'function') {
    return events.emit(...args);
  }
  return undefined;
}; 