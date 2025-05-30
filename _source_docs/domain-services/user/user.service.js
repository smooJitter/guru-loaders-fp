import User from '../models/User.js';
import { withErrorHandling } from './utils/errorHandling.js';
import { ERRORS } from './utils/constants.js';

/**
 * Remove sensitive fields from a user object
 * @param {Object} user
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) return user;
  const {
    passwordHash,
    token,
    resetToken,
    ...safeUser
  } = user;
  return safeUser;
}

/**
 * Create a new user
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.tenantId
 * @param {string} [params.invitedBy]
 * @returns {Promise<Object>} // sanitized user
 */
export const createUser = withErrorHandling(async ({ email, tenantId, invitedBy }) => {
  const user = await new User({ email, tenantId, invitedBy, status: invitedBy ? 'invited' : 'active' }).save();
  return sanitizeUser(user.toObject());
});

/**
 * Get user by ID
 * @param {Object} params
 * @param {string} params.id
 * @returns {Promise<Object>} // sanitized user
 */
export const getUserById = withErrorHandling(async ({ id }) => {
  const user = await User.findById(id).lean().exec();
  if (!user) throw new Error(ERRORS.USER_NOT_FOUND(id));
  return sanitizeUser(user);
});

/**
 * Get user by email
 * @param {Object} params
 * @param {string} params.email
 * @returns {Promise<Object>} // sanitized user
 */
export const getUserByEmail = withErrorHandling(async ({ email }) => {
  const user = await User.findOne({ email }).lean().exec();
  if (!user) throw new Error(ERRORS.USER_NOT_FOUND(email));
  return sanitizeUser(user);
});

/**
 * List users
 * @param {Object} [params]
 * @param {Object} [params.filter]
 * @returns {Promise<Object[]>} // array of sanitized users
 */
export const listUsers = withErrorHandling(async ({ filter = {} } = {}) => {
  const users = await User.find(filter).lean().exec();
  return users ? users.map(sanitizeUser) : [];
});

/**
 * Update user
 * @param {Object} params
 * @param {string} params.id
 * @param {Object} params.updates
 * @returns {Promise<Object>} // sanitized user
 */
export const updateUser = withErrorHandling(async ({ id, updates }) => {
  const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean().exec();
  if (!user) throw new Error(ERRORS.USER_NOT_FOUND(id));
  return sanitizeUser(user);
});

/**
 * Mark user as deleted
 * @param {Object} params
 * @param {string} params.id
 * @returns {Promise<Object>} // sanitized user
 */
export const markUserDeleted = withErrorHandling(async ({ id }) => {
  return await updateUser({ id, updates: { status: 'deleted' } });
});

/**
 * Record user login
 * @param {Object} params
 * @param {string} params.id
 * @returns {Promise<Object>} // sanitized user
 */
export const recordLogin = withErrorHandling(async ({ id }) => {
  return await updateUser({ id, updates: { lastLogin: new Date(), status: 'active' } });
});

/**
 * Get recent events for user (stub)
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object[]>}
 */
export const getRecentEvents = withErrorHandling(async ({ userId }) => {
  // Always return an array
  return [
    { title: 'Salsa Night', date: new Date(Date.now() - 86400000 * 3).toISOString() },
    { title: 'Kizomba Social', date: new Date(Date.now() - 86400000 * 7).toISOString() }
  ];
}); 