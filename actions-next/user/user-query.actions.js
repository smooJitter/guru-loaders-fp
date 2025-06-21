// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeUser = (user) => {
  // Logic to sanitize user (customize as needed)
  return user;
};

import { withNamespace } from '../../src/utils/with-namespace.js';

const getUserById = async ({ context, id }) => {
  const { models } = context;
  const User = models.User;
  if (!id) throw new Error(ERRORS.INVALID_INPUT);
  const user = await User.findById(id).lean().exec();
  return user ? sanitizeUser(user) : null;
};

const getUserByEmail = async ({ context, email }) => {
  const { models } = context;
  const User = models.User;
  if (!email) throw new Error(ERRORS.INVALID_INPUT);
  const user = await User.findOne({ email }).lean().exec();
  return user ? sanitizeUser(user) : null;
};

const listUsers = async ({ context, limit = 10, offset = 0, filters = {} } = {}) => {
  const { models } = context;
  const User = models.User;
  const [users, total] = await Promise.all([
    User.find(filters).skip(offset).limit(limit).lean().exec(),
    User.countDocuments(filters)
  ]);
  return {
    items: Array.isArray(users) ? users.map(sanitizeUser) : [],
    total,
    hasMore: total > offset + (Array.isArray(users) ? users.length : 0)
  };
};

const searchUsers = async ({ context, query, limit = 10, offset = 0 }) => {
  const { models } = context;
  const User = models.User;
  if (!query) throw new Error(ERRORS.INVALID_INPUT);
  const searchQuery = {
    $or: [
      { email: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } }
    ]
  };
  const [users, total] = await Promise.all([
    User.find(searchQuery).skip(offset).limit(limit).lean().exec(),
    User.countDocuments(searchQuery)
  ]);
  return {
    items: Array.isArray(users) ? users.map(sanitizeUser) : [],
    total,
    hasMore: total > offset + (Array.isArray(users) ? users.length : 0)
  };
};

export default withNamespace('user', {
  getUserById,
  getUserByEmail,
  listUsers,
  searchUsers
});
