import UserAccount from '../../domain-models/user/user-account.model.js';
import { withErrorHandling } from './utils/errorHandling.js';
import { ERRORS } from './utils/constants.js';

/**
 * Remove sensitive fields from an account object
 * @param {Object} account
 * @returns {Object}
 */
function sanitizeAccount(account) {
  if (!account) return account;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeAccount } = account;
  return safeAccount;
}

/**
 * Create a new user account
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.tenantId
 * @param {string[]} [params.roles]
 * @returns {Promise<Object>} // sanitized account
 */
export const createAccount = withErrorHandling(async ({ userId, tenantId, roles = ['customer'] }) => {
  const account = await new UserAccount({ userId, tenantId, roles }).save();
  return sanitizeAccount(account.toObject());
});

/**
 * Get account by userId
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized account
 */
export const getAccountByUserId = withErrorHandling(async ({ userId }) => {
  const account = await UserAccount.findOne({ userId }).lean().exec();
  if (!account) throw new Error(ERRORS.ACCOUNT_NOT_FOUND(userId));
  return sanitizeAccount(account);
});

/**
 * Update user preferences
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object} params.prefs
 * @returns {Promise<Object>} // sanitized account
 */
export const updatePreferences = withErrorHandling(async ({ userId, prefs }) => {
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { preferences: prefs },
    { new: true }
  ).lean().exec();
  if (!account) throw new Error(ERRORS.ACCOUNT_NOT_FOUND(userId));
  return sanitizeAccount(account);
});

/**
 * Assign roles to user
 * @param {Object} params
 * @param {string} params.userId
 * @param {string[]} params.roles
 * @returns {Promise<Object>} // sanitized account
 */
export const assignRoles = withErrorHandling(async ({ userId, roles }) => {
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { roles },
    { new: true }
  ).lean().exec();
  if (!account) throw new Error(ERRORS.ACCOUNT_NOT_FOUND(userId));
  return sanitizeAccount(account);
});

/**
 * Add badge to user
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.badge
 * @returns {Promise<Object>} // sanitized account
 */
export const addBadge = withErrorHandling(async ({ userId, badge }) => {
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { $addToSet: { badges: badge } },
    { new: true }
  ).lean().exec();
  if (!account) throw new Error(ERRORS.ACCOUNT_NOT_FOUND(userId));
  return sanitizeAccount(account);
});

/**
 * Adjust user reputation
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.delta
 * @returns {Promise<Object>} // sanitized account
 */
export const adjustReputation = withErrorHandling(async ({ userId, delta }) => {
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { $inc: { reputation: delta } },
    { new: true }
  ).lean().exec();
  if (!account) throw new Error(ERRORS.ACCOUNT_NOT_FOUND(userId));
  return sanitizeAccount(account);
}); 