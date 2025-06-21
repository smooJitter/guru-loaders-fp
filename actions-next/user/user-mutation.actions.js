// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeUser = (user) => {
  // Logic to sanitize user (customize as needed)
  return user;
};

const validateUser = (data) => {
  // Example validation logic (customize as needed)
  if (!data || !data.email) return { isLeft: true };
  return { isLeft: false, value: data };
};

import { withNamespace } from '../../src/utils/with-namespace.js';

const createUser = async ({ context, ...data }) => {
  const { models } = context;
  const User = models.User;
  const validated = validateUser(data);
  if (validated.isLeft) throw new Error(ERRORS.INVALID_INPUT);
  const user = await new User({
    ...validated.value,
    status: validated.value.invitedBy ? 'invited' : 'active'
  }).save();
  return sanitizeUser(user.toObject());
};

const updateUser = async ({ context, id, updates }) => {
  const { models } = context;
  const User = models.User;
  if (!id) throw new Error(ERRORS.INVALID_INPUT);
  const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean().exec();
  return user ? sanitizeUser(user) : null;
};

const markUserDeleted = async ({ context, id }) => {
  return await updateUser({ context, id, updates: { status: 'deleted' } });
};

const recordLogin = async ({ context, id }) => {
  return await updateUser({ context, id, updates: { lastLogin: new Date(), status: 'active' } });
};

export default withNamespace('user', {
  createUser,
  updateUser,
  markUserDeleted,
  recordLogin
});
