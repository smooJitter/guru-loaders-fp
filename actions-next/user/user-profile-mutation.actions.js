// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeProfile = (profile) => {
  // Logic to sanitize profile (customize as needed)
  return profile;
};

import { withNamespace } from '../../src/utils/with-namespace.js';
import { getPluginMethods } from '../../models-next/plugins/utils/get-plugin-methods.js';

const createProfile = async ({ context, userId, tenantId, name }) => {
  const { models } = context;
  const UserProfile = models.UserProfile;
  if (!userId || !tenantId) throw new Error(ERRORS.INVALID_INPUT);
  const profile = await new UserProfile({ userId, tenantId, name: name ?? '' }).save();
  return sanitizeProfile(profile.toObject());
};

const updateProfile = async ({ context, userId, updates }) => {
  const { models } = context;
  const UserProfile = models.UserProfile;
  if (!userId) throw new Error(ERRORS.INVALID_INPUT);
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    updates,
    { new: true }
  ).lean().exec();
  return profile ? sanitizeProfile(profile) : null;
};

const updateVisibility = async ({ context, userId, visibility }) => {
  const { models } = context;
  const UserProfile = models.UserProfile;
  if (!userId || !visibility) throw new Error(ERRORS.INVALID_INPUT);
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { visibility },
    { new: true }
  ).lean().exec();
  return profile ? sanitizeProfile(profile) : null;
};

const updateSocialLinks = async ({ context, userId, links }) => {
  const { models } = context;
  const UserProfile = models.UserProfile;
  if (!userId || !links) throw new Error(ERRORS.INVALID_INPUT);
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { social: links },
    { new: true }
  ).lean().exec();
  return profile ? sanitizeProfile(profile) : null;
};

const updateProfileWithPlugin = async ({ context, userId, updates, getPluginMethods: injectedGetPluginMethods }) => {
  const { models } = context;
  const UserProfile = models.UserProfile;
  if (!userId) throw new Error(ERRORS.INVALID_INPUT);
  const profile = await UserProfile.findOne({ userId });
  if (!profile) return null;

  // Apply updates
  Object.assign(profile, updates);

  // Use plugin methods if available (e.g., manually update updatedAt)
  const getPluginMethodsToUse = injectedGetPluginMethods || getPluginMethods;
  const pluginMethods = getPluginMethodsToUse(UserProfile);
  if (pluginMethods && pluginMethods.setUpdatedAt) {
    pluginMethods.setUpdatedAt.call(profile, new Date());
  } else {
    // Fallback: update the field directly
    profile.updatedAt = new Date();
    console.debug('[updateProfileWithPlugin] Fallback branch: set updatedAt to', profile.updatedAt, 'on', profile);
  }

  await profile.save();
  return sanitizeProfile(profile.toObject());
};

export default withNamespace('userProfile', {
  createProfile,
  updateProfile,
  updateVisibility,
  updateSocialLinks,
  updateProfileWithPlugin
});
