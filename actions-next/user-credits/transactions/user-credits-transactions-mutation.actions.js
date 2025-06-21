/**
 * @module user-credits/transactions/user-credits-transactions-mutation.actions
 * Mutation actions for user-credits transactions.
 * All actions are pure, composable, auditable, and validated.
 */

import { is, isNil } from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  creditTransactionSchema,
  creditTopUpSchema,
  spendCreditsSchema,
  refundCreditsSchema,
  expireCreditsSchema,
  transferCreditsSchema
} from './lib/user-credits-transactions-mutation.validation.js';
// TODO: Import Ramda and action audit utility as needed

/**
 * Error messages for user-credits transactions
 * @typedef {Object} Errors
 * @property {function(string): string} INVALID_CREDIT_TRANSACTION - Invalid credit transaction error
 * @property {string} INSUFFICIENT_CREDITS - Insufficient credits error
 * @property {string} INVALID_INPUT - Invalid input error
 */
const ERRORS = {
  INVALID_CREDIT_TRANSACTION: (msg) => `Invalid credit transaction: ${msg}`,
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Credit transaction types
 * @readonly
 * @enum {string}
 */
const CREDIT_TRANSACTION_TYPES = {
  TOP_UP: 'top_up',
  SPEND: 'spend',
  TRANSFER_OUT: 'transfer_out',
  TRANSFER_IN: 'transfer_in',
  REFUND: 'refund',
  EXPIRATION: 'expiration',
};

/**
 * Remove internal fields from transaction object
 * @param {object} txn - The transaction object
 * @returns {object} Sanitized transaction object
 */
const sanitizeTransaction = (txn) => {
  if (isNil(txn)) return txn;
  const { __v, ...rest } = txn;
  return rest;
};

/**
 * Create a credit transaction
 * @param {object} input - Input object containing context and transaction data
 * @param {object} input.context - The request context
 * @returns {Promise<object>} The created transaction object
 */
export const createCreditTransaction = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(creditTransactionSchema, data);
  if (!isNotNilOrEmpty(validated.userId) || !is(Number, validated.amount) || !isNotNilOrEmpty(validated.type)) {
    throw new Error(ERRORS.INVALID_CREDIT_TRANSACTION('Missing required fields'));
  }
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
  const transaction = await CreditTransaction.create(validated);
  return sanitizeTransaction(transaction.toObject());
};

/**
 * Top up credits for a user
 * @param {object} input - Input object containing context, userId, amount, and stripeRef
 * @param {object} input.context - The request context
 * @param {string} input.userId - The user ID
 * @param {number} input.amount - Amount to top up
 * @param {string} [input.stripeRef] - Stripe reference (optional)
 * @returns {Promise<number>} New balance
 */
export const creditTopUp = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(creditTopUpSchema, data);
  const { userId, amount, stripeRef } = validated;
  if (!isNotNilOrEmpty(userId) || !is(Number, amount)) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  await CreditTransaction.create({
    userId,
    amount,
    type: CREDIT_TRANSACTION_TYPES.TOP_UP,
    referenceId: stripeRef,
    description: `Top-up ${amount} credits`
  });
  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  ).lean().exec();
  return account.balance;
};

/**
 * Spend credits for a user
 * @param {object} input - Input object containing context, userId, amount, and description
 * @param {object} input.context - The request context
 * @param {string} input.userId - The user ID
 * @param {number} input.amount - Amount to spend
 * @param {string} [input.description] - Description (optional)
 * @returns {Promise<number>} New balance
 */
export const spendCredits = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(spendCreditsSchema, data);
  const { userId, amount, description = '' } = validated;
  if (!isNotNilOrEmpty(userId) || !is(Number, amount)) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const account = await CreditAccount.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (isNil(account)) throw new Error(ERRORS.INSUFFICIENT_CREDITS); // # Reason: Prevent overspending
  await CreditTransaction.create({
    userId,
    amount: -amount,
    type: CREDIT_TRANSACTION_TYPES.SPEND,
    description: description || `Spent ${amount} credits`
  });
  return account.balance;
};

/**
 * Refund credits to a user
 * @param {object} input - Input object containing context, userId, amount, referenceId, and description
 * @param {object} input.context - The request context
 * @param {string} input.userId - The user ID
 * @param {number} input.amount - Amount to refund
 * @param {string} [input.referenceId] - Reference ID (optional)
 * @param {string} [input.description] - Description (optional)
 * @returns {Promise<number>} New balance
 */
export const refundCredits = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(refundCreditsSchema, data);
  const { userId, amount, referenceId, description = '' } = validated;
  if (!isNotNilOrEmpty(userId) || !is(Number, amount)) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  await CreditTransaction.create({
    userId,
    amount,
    type: CREDIT_TRANSACTION_TYPES.REFUND,
    referenceId,
    description: description || `Refunded ${amount} credits`
  });
  const account = await CreditAccount.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  return account.balance;
};

/**
 * Expire credits for a user
 * @param {object} input - Input object containing context, userId, amount, and reason
 * @param {object} input.context - The request context
 * @param {string} input.userId - The user ID
 * @param {number} input.amount - Amount to expire
 * @param {string} [input.reason] - Reason for expiration (optional)
 * @returns {Promise<number>} New balance
 */
export const expireCredits = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(expireCreditsSchema, data);
  const { userId, amount, reason } = validated;
  if (!isNotNilOrEmpty(userId) || !is(Number, amount)) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const account = await CreditAccount.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean().exec();
  if (isNil(account)) throw new Error(ERRORS.INSUFFICIENT_CREDITS); // # Reason: Prevent expiring more credits than available
  await CreditTransaction.create({
    userId,
    amount: -amount,
    type: CREDIT_TRANSACTION_TYPES.EXPIRATION,
    description: reason || `Credits expired: ${amount}`
  });
  return account.balance;
};

/**
 * Transfer credits between users
 * @param {object} input - Input object containing context, fromUserId, toUserId, amount, and description
 * @param {object} input.context - The request context
 * @param {string} input.fromUserId - Sender user ID
 * @param {string} input.toUserId - Receiver user ID
 * @param {number} input.amount - Amount to transfer
 * @param {string} [input.description] - Description (optional)
 * @returns {Promise<object>} Result with new balances for both users
 */
export const transferCredits = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(transferCreditsSchema, data);
  const { fromUserId, toUserId, amount, description = '' } = validated;
  if (!isNotNilOrEmpty(fromUserId) || !isNotNilOrEmpty(toUserId) || !is(Number, amount)) {
    throw new Error(ERRORS.INVALID_INPUT);
  }
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const session = await CreditAccount.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      // Deduct from sender
      const fromAccount = await CreditAccount.findOneAndUpdate(
        { userId: fromUserId, balance: { $gte: amount } },
        { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
        { new: true, session }
      ).lean().exec();
      if (isNil(fromAccount)) throw new Error(ERRORS.INSUFFICIENT_CREDITS); // # Reason: Prevent overdraft on transfer
      // Add to receiver
      const toAccount = await CreditAccount.findOneAndUpdate(
        { userId: toUserId },
        { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
        { new: true, session }
      ).lean().exec();
      // Create transactions
      await Promise.all([
        CreditTransaction.create([{
          userId: fromUserId,
          amount: -amount,
          type: CREDIT_TRANSACTION_TYPES.TRANSFER_OUT,
          description: description || `Transferred ${amount} credits to user ${toUserId}`
        }], { session }),
        CreditTransaction.create([{
          userId: toUserId,
          amount,
          type: CREDIT_TRANSACTION_TYPES.TRANSFER_IN,
          description: description || `Received ${amount} credits from user ${fromUserId}`
        }], { session })
      ]);
      result = {
        fromUser: { userId: fromUserId, newBalance: fromAccount.balance },
        toUser: { userId: toUserId, newBalance: toAccount.balance }
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
};

/**
 * Default export: Barrel of all mutation actions with audit meta, namespaced
 * @namespace userCreditsTransactions
 */
export default withNamespace('userCreditsTransactions', {
  createCreditTransaction: { method: createCreditTransaction, meta: { audit: true } },
  creditTopUp: { method: creditTopUp, meta: { audit: true } },
  spendCredits: { method: spendCredits, meta: { audit: true } },
  refundCredits: { method: refundCredits, meta: { audit: true } },
  expireCredits: { method: expireCredits, meta: { audit: true } },
  transferCredits: { method: transferCredits, meta: { audit: true } }
});
