// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
  INVALID_ROLE: (role) => `Invalid role: ${role}`,
};

const USER_ROLES = ['admin', 'user', 'guest'];

const sanitizeAccount = (account) => {
  // Logic to sanitize account (customize as needed)
  return account;
};

const validateInput = ({ userId, tenantId, prefs, roles, badge, delta }) => {
  if (!userId || (!tenantId && !prefs && !roles && !badge && typeof delta !== 'number')) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
};

const validateRoles = (roles, validRoles) => {
  if (!roles.every((r) => validRoles.includes(r))) {
    throw new Error(ERRORS.INVALID_ROLE(roles.find((r) => !validRoles.includes(r))));
  }
};

import { withNamespace } from '../../src/utils/with-namespace.js';

const createAccount = async ({ context, userId, tenantId, roles }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  validateInput({ userId, tenantId });
  const account = await new UserAccount({
    userId,
    tenantId,
    roles: roles ?? [USER_ROLES[0]]
  }).save();
  return sanitizeAccount(account.toObject());
};

const updatePreferences = async ({ context, userId, prefs }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  validateInput({ userId, prefs });
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { preferences: prefs },
    { new: true }
  ).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

const assignRoles = async ({ context, userId, roles }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  validateInput({ userId, roles });
  validateRoles(roles, USER_ROLES);
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { roles },
    { new: true }
  ).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

const addBadge = async ({ context, userId, badge }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  validateInput({ userId, badge });
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { $addToSet: { badges: badge } },
    { new: true }
  ).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

const adjustReputation = async ({ context, userId, delta }) => {
  const { models } = context;
  const UserAccount = models.UserAccount;
  validateInput({ userId, delta });
  const account = await UserAccount.findOneAndUpdate(
    { userId },
    { $inc: { reputation: delta } },
    { new: true }
  ).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

export default withNamespace('userAccount', {
  createAccount,
  updatePreferences,
  assignRoles,
  addBadge,
  adjustReputation
});
