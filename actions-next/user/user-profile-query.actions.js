// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeProfile = (profile) => {
  // Logic to sanitize profile (customize as needed)
  return profile;
};

import { withNamespace } from '../../src/utils/with-namespace.js';

const getProfileByUserId = async ({ context, userId }) => {
  const { models } = context;
  const UserProfile = models.UserProfile;
  if (!userId) throw new Error(ERRORS.INVALID_INPUT);
  const profile = await UserProfile.findOne({ userId }).lean().exec();
  return profile ? sanitizeProfile(profile) : null;
};

export default withNamespace('userProfile', {
  getProfileByUserId
});
