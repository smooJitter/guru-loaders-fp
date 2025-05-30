import UserProfile from '../models/UserProfile.js';
import { withErrorHandling } from './utils/errorHandling.js';
import { ERRORS } from './utils/constants.js';

/**
 * Remove sensitive fields from a profile object
 * @param {Object} profile
 * @returns {Object}
 */
function sanitizeProfile(profile) {
  if (!profile) return profile;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safeProfile } = profile;
  return safeProfile;
}

/**
 * Create a new user profile
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.tenantId
 * @param {string} [params.name]
 * @returns {Promise<Object>} // sanitized profile
 */
export const createProfile = withErrorHandling(async ({ userId, tenantId, name = '' }) => {
  const profile = await new UserProfile({ userId, tenantId, name }).save();
  return sanitizeProfile(profile.toObject());
});

/**
 * Get profile by userId
 * @param {Object} params
 * @param {string} params.userId
 * @returns {Promise<Object>} // sanitized profile
 */
export const getProfileByUserId = withErrorHandling(async ({ userId }) => {
  const profile = await UserProfile.findOne({ userId }).lean().exec();
  if (!profile) throw new Error(ERRORS.PROFILE_NOT_FOUND(userId));
  return sanitizeProfile(profile);
});

/**
 * Update full profile
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object} params.updates
 * @returns {Promise<Object>} // sanitized profile
 */
export const updateProfile = withErrorHandling(async ({ userId, updates }) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    updates,
    { new: true }
  ).lean().exec();
  if (!profile) throw new Error(ERRORS.PROFILE_NOT_FOUND(userId));
  return sanitizeProfile(profile);
});

/**
 * Update profile visibility
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.visibility
 * @returns {Promise<Object>} // sanitized profile
 */
export const updateVisibility = withErrorHandling(async ({ userId, visibility }) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { visibility },
    { new: true }
  ).lean().exec();
  if (!profile) throw new Error(ERRORS.PROFILE_NOT_FOUND(userId));
  return sanitizeProfile(profile);
});

/**
 * Update social links
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object} params.links
 * @returns {Promise<Object>} // sanitized profile
 */
export const updateSocialLinks = withErrorHandling(async ({ userId, links }) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { social: links },
    { new: true }
  ).lean().exec();
  if (!profile) throw new Error(ERRORS.PROFILE_NOT_FOUND(userId));
  return sanitizeProfile(profile);
}); 