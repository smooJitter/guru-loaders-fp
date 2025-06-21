/**
 * @module user-credits/transactions/bulk.actions
 * Bulk actions for user-credits transactions.
 * All actions must be pure, composable, auditable, and validated.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { validate } from '../../utils/validate.js';
import {
  bulkCreateTransactionsSchema,
  bulkExpireCreditsSchema,
  bulkTransferCreditsSchema
} from './lib/user-credits-transaction-bulk.validation.js';

/**
 * Error messages for user-credits transactions bulk actions
 */
const ERRORS = {
  INVALID_CREDIT_TRANSACTION: (msg) => `Invalid credit transaction: ${msg}`,
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from transaction object
 * @param {object} txn - The transaction object
 * @returns {object} Sanitized transaction object
 */
export const sanitizeTransaction = (txn) => {
  if (R.isNil(txn)) return txn;
  const { __v, ...rest } = txn;
  return rest;
};

/**
 * Bulk create credit transactions
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {Array<object>} params.transactions - Array of transaction objects
 * @returns {Promise<object>} Result with count
 */
export const bulkCreateTransactions = async ({ context, transactions }) => {
  const validated = await validate(bulkCreateTransactionsSchema, { transactions });
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
  const result = await CreditTransaction.insertMany(validated.transactions);
  return { count: result.length };
};

/**
 * Bulk expire credits for multiple users
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {Array<string>} params.userIds - User IDs
 * @param {number} params.amount - Amount to expire per user
 * @param {string} [params.reason] - Reason for expiration
 * @returns {Promise<object>} Result with matched/modified counts
 */
export const bulkExpireCredits = async ({ context, userIds, amount, reason }) => {
  const validated = await validate(bulkExpireCreditsSchema, { userIds, amount, reason });
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const session = await CreditAccount.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      // Update accounts
      const accountResult = await CreditAccount.updateMany(
        {
          userId: { $in: validated.userIds },
          balance: { $gte: validated.amount }
        },
        {
          $inc: { balance: -validated.amount },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
      // Create transactions
      const transactions = validated.userIds.map(userId => ({
        userId,
        amount: -validated.amount,
        type: 'expiration',
        description: validated.reason || `Credits expired: ${validated.amount}`
      }));
      await CreditTransaction.insertMany(transactions, { session });
      result = {
        matched: accountResult.matchedCount,
        modified: accountResult.modifiedCount
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
};

/**
 * Bulk transfer credits from one user to many
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.fromUserId - Sender user ID
 * @param {Array<string>} params.toUserIds - Receiver user IDs
 * @param {number} params.amountPerUser - Amount to transfer to each receiver
 * @param {string} [params.description] - Description (optional)
 * @returns {Promise<object>} Result with balances and counts
 */
export const bulkTransferCredits = async ({ context, fromUserId, toUserIds, amountPerUser, description = '' }) => {
  const validated = await validate(bulkTransferCreditsSchema, { fromUserId, toUserIds, amountPerUser, description });
  const { models } = context;
  const CreditAccount = models.CreditAccount;
  const CreditTransaction = models.CreditTransaction;
  const session = await CreditAccount.startSession();
  let result = null;
  try {
    await session.withTransaction(async () => {
      const totalAmount = validated.amountPerUser * validated.toUserIds.length;
      // Check and update sender balance
      const fromAccount = await CreditAccount.findOneAndUpdate(
        {
          userId: validated.fromUserId,
          balance: { $gte: totalAmount }
        },
        {
          $inc: { balance: -totalAmount },
          $set: { updatedAt: new Date() }
        },
        { new: true, session }
      ).lean().exec();
      if (R.isNil(fromAccount)) throw new Error(ERRORS.INSUFFICIENT_CREDITS); // # Reason: Prevent overdraft on bulk transfer
      // Update receiver balances
      await CreditAccount.updateMany(
        { userId: { $in: validated.toUserIds } },
        {
          $inc: { balance: validated.amountPerUser },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
      // Create transactions
      const transactions = [
        // Sender transaction
        {
          userId: validated.fromUserId,
          amount: -totalAmount,
          type: 'bulk_transfer_out',
          description: validated.description || `Bulk transferred ${totalAmount} credits to ${validated.toUserIds.length} users`
        },
        // Receiver transactions
        ...validated.toUserIds.map(toUserId => ({
          userId: toUserId,
          amount: validated.amountPerUser,
          type: 'transfer_in',
          description: validated.description || `Received ${validated.amountPerUser} credits from bulk transfer`
        }))
      ];
      await CreditTransaction.insertMany(transactions, { session });
      result = {
        fromUser: {
          userId: validated.fromUserId,
          newBalance: fromAccount.balance - totalAmount
        },
        recipients: validated.toUserIds.length,
        amountPerUser: validated.amountPerUser,
        totalAmount
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
};

/**
 * Default export: Barrel of all bulk actions with audit meta, namespaced
 * @namespace userCreditsTransactions
 */
export default withNamespace('userCreditsTransactions', {
  bulkCreateTransactions: { method: bulkCreateTransactions, meta: { audit: true } },
  bulkExpireCredits: { method: bulkExpireCredits, meta: { audit: true } },
  bulkTransferCredits: { method: bulkTransferCredits, meta: { audit: true } }
});
