import bcrypt from 'bcrypt';
import jwt   from 'jsonwebtoken';
import UserAuth from '../models/UserAuth.js';
import { withErrorHandling } from './utils/errorHandling.js';
import { ERRORS } from './utils/constants.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Remove sensitive fields from an auth object
 * @param {Object} auth
 * @returns {Object}
 */
function sanitizeAuth(auth) {
  if (!auth) return auth;
  const {
    passwordHash,
    token,
    resetToken,
    providerData,
    ...safeAuth
  } = auth;
  // Optionally, keep only non-sensitive providerData fields
  return safeAuth;
}

/**
 * Register local authentication
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.plainPassword
 * @returns {Promise<Object>} // sanitized auth
 */
export const registerLocalAuth = withErrorHandling(async ({ userId, plainPassword }) => {
  const auth = await new UserAuth({ userId, passwordHash: plainPassword }).save();
  return sanitizeAuth(auth.toObject());
});

/**
 * Validate local login
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {Function} params.getUserByEmail
 * @returns {Promise<{token: string, user: Object}>}
 */
export const validateLocalLogin = withErrorHandling(async ({ email, password, getUserByEmail }) => {
  const user = await getUserByEmail(email);
  if (!user) throw new Error(ERRORS.INVALID_CREDENTIALS(email));

  const auth = await UserAuth.findOne({ userId: user._id }).lean().exec();
  if (!auth) throw new Error(ERRORS.NO_AUTH_RECORD(user._id));

  const ok = await bcrypt.compare(password, auth.passwordHash);
  if (!ok) throw new Error(ERRORS.INVALID_CREDENTIALS(email));

  const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '1d' });
  await UserAuth.updateOne({ userId: user._id }, { token }).exec();

  return { token, user };
});

/**
 * Logout user
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized auth
 */
export const logout = withErrorHandling(async ({ userId }) => {
  await UserAuth.updateOne({ userId }, { $unset: { token: '' } }).exec();
  const auth = await UserAuth.findOne({ userId }).lean().exec();
  if (!auth) throw new Error(ERRORS.NO_AUTH_RECORD(userId));
  return sanitizeAuth(auth);
});

/**
 * Initiate password reset
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.token
 * @param {number} [params.ttlMinutes]
 * @returns {Promise<Object>} // sanitized auth
 */
export const initiatePasswordReset = withErrorHandling(async ({ userId, token, ttlMinutes = 30 }) => {
  await UserAuth.updateOne(
    { userId },
    { resetToken: token, expiresAt: new Date(Date.now() + ttlMinutes*60*1000) }
  ).exec();
  const auth = await UserAuth.findOne({ userId }).lean().exec();
  if (!auth) throw new Error(ERRORS.NO_AUTH_RECORD(userId));
  return sanitizeAuth(auth);
});

/**
 * Reset password
 * @param {Object} params
 * @param {string} params.token
 * @param {string} params.newPassword
 * @returns {Promise<boolean>}
 */
export const resetPassword = withErrorHandling(async ({ token, newPassword }) => {
  const auth = await UserAuth.findOne({ resetToken: token, expiresAt: { $gt: new Date() } }).exec();
  if (!auth) throw new Error(ERRORS.INVALID_OR_EXPIRED_RESET_TOKEN(token));

  auth.passwordHash = newPassword;
  auth.resetToken  = undefined;
  auth.expiresAt   = undefined;
  await auth.save();
  return true;
}); 