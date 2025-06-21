/**
 * @module user-credits/account/query.actions
 * Query actions for user-credits account.
 * All actions must be pure, composable, and auditable.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';

const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

export const sanitizeAccount = (account) => {
  if (R.isNil(account)) return account;
  // Remove internal fields if needed
  return account;
};

/**
 * Get or create a credit account
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @returns {Promise<object|null>} The account or null
 */
export const getOrCreateAccount = async ({ context, userId }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

/**
 * Get credit account by user
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @returns {Promise<object|null>} The account or null
 */
export const getCreditAccountByUser = async ({ context, userId }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return account ? sanitizeAccount(account) : null;
};

/**
 * Get credit account balance
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @returns {Promise<number>} The account balance or 0
 */
export const getBalance = async ({ context, userId }) => {
  const { CreditAccount } = context.models;
  const account = await CreditAccount.findOne({ userId }).lean().exec();
  return account ? account.balance : 0;
};

export default withNamespace('userCreditsAccount', {
  getOrCreateAccount: { method: getOrCreateAccount, meta: { audit: true } },
  getCreditAccountByUser: { method: getCreditAccountByUser, meta: { audit: true } },
  getBalance: { method: getBalance, meta: { audit: true } }
});
