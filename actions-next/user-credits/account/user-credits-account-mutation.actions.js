/**
 * @module user-credits/account/mutation.actions
 * Mutation actions for user-credits account.
 * All actions must be pure, composable, and auditable.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';

const ERRORS = {
  INVALID_ACCOUNT: (msg) => `Invalid credit account: ${msg}`,
  INVALID_INPUT: 'Invalid input',
};

const sanitizeAccount = (account) => {
  if (R.isNil(account)) return account;
  // Remove internal fields if needed
  return account;
};

/**
 * Example mutation action (replace with real actions)
 * @param {object} context - The request context
 * @returns {Promise<object>} Result
 */
export const exampleMutation = async (context) => {
  // TODO: Implement mutation logic
  return {};
};

/**
 * Create a credit account
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @returns {Promise<object>} The created account
 */
export const createCreditAccount = async ({ context, ...data }) => {
  const { CreditAccount } = context.models;
  if (!data.userId) throw new Error(ERRORS.INVALID_ACCOUNT('Validation failed'));
  const account = await new CreditAccount(data).save();
  return sanitizeAccount(account.toObject());
};

/**
 * Adjust credit account balance
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @param {number} params.amount - Amount to adjust
 * @returns {Promise<object|null>} The updated account or null
 */
export const adjustCreditAccountBalance = async ({ context, userId, amount }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

// Barrel export for all mutation actions
export default withNamespace('userCreditsAccount', {
  exampleMutation,
  createCreditAccount: { method: createCreditAccount, meta: { audit: true } },
  adjustCreditAccountBalance: { method: adjustCreditAccountBalance, meta: { audit: true } }
});
