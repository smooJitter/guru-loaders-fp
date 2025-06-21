/**
 * @module user-credits/transactions/query.actions
 * Query actions for user-credits transactions.
 * All actions must be pure, composable, and auditable.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';

/**
 * Error messages for user-credits transactions queries
 */
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from transaction object
 * @param {object} txn - The transaction object
 * @returns {object} Sanitized transaction object
 */
const sanitizeTransaction = (txn) => {
  if (R.isNil(txn)) return txn;
  const { __v, ...rest } = txn;
  return rest;
};

/**
 * Get transactions for a user with pagination and sorting
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @param {number} [params.limit=10] - Max results
 * @param {number} [params.offset=0] - Offset for pagination
 * @param {string} [params.sortBy='createdAt'] - Sort field
 * @param {number} [params.sortOrder=-1] - Sort order
 * @returns {Promise<object>} Paginated result
 */
const getTransactionsByUser = async ({ context, userId, limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = -1 }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { CreditTransaction } = context.models;
  const query = CreditTransaction.find({ userId })
    .sort({ [sortBy]: sortOrder })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();
  const [transactions, total] = await Promise.all([
    query,
    CreditTransaction.countDocuments({ userId })
  ]);
  return {
    items: R.map(sanitizeTransaction, transactions || []),
    total,
    hasMore: total > offset + (transactions?.length || 0)
  };
};

/**
 * List transactions by type
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.type - Transaction type
 * @param {number} [params.limit=10]
 * @param {number} [params.offset=0]
 * @returns {Promise<object>} Paginated result
 */
const listTransactionsByType = async ({ context, type, limit = 10, offset = 0 }) => {
  if (!isNotNilOrEmpty(type)) throw new Error(ERRORS.INVALID_INPUT);
  const { CreditTransaction } = context.models;
  const [transactions, total] = await Promise.all([
    CreditTransaction.find({ type })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    CreditTransaction.countDocuments({ type })
  ]);
  return {
    items: R.map(sanitizeTransaction, transactions || []),
    total,
    hasMore: total > offset + (transactions?.length || 0)
  };
};

/**
 * Get credit balance history for a user over time
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {string} [params.interval='day']
 * @returns {Promise<Array>} Balance history
 */
const getCreditBalanceHistory = async ({ context, userId, startDate, endDate, interval = 'day' }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { CreditTransaction } = context.models;
  const match = { userId };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  // # Reason: Grouping by interval for reporting
  const dateFormat = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-%U' : '%Y-%m-%d';
  const pipeline = [
    { $match: match },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        lastBalance: { $last: '$balance' },
        lastTxn: { $last: '$$ROOT' }
      }
    },
    { $sort: { _id: 1 } }
  ];
  const history = await CreditTransaction.aggregate(pipeline);
  return (history || []).map(h => ({
    date: h._id,
    balance: h.lastBalance,
    transaction: sanitizeTransaction(h.lastTxn)
  }));
};

/**
 * Get transaction stats for a user
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.userId - The user ID
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<Array>} Stats by type
 */
const getTransactionStats = async ({ context, userId, startDate, endDate }) => {
  if (!isNotNilOrEmpty(userId)) throw new Error(ERRORS.INVALID_INPUT);
  const { CreditTransaction } = context.models;
  const match = { userId };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];
  return await CreditTransaction.aggregate(pipeline);
};

/**
 * Search transactions by description or referenceId
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} params.query - Search string
 * @param {number} [params.limit=10]
 * @param {number} [params.offset=0]
 * @returns {Promise<object>} Paginated result
 */
const searchTransactions = async ({ context, query, limit = 10, offset = 0 }) => {
  if (!isNotNilOrEmpty(query)) throw new Error(ERRORS.INVALID_INPUT);
  const { CreditTransaction } = context.models;
  const searchQuery = {
    $or: [
      { description: { $regex: query, $options: 'i' } },
      { referenceId: { $regex: query, $options: 'i' } }
    ]
  };
  const [transactions, total] = await Promise.all([
    CreditTransaction.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    CreditTransaction.countDocuments(searchQuery)
  ]);
  return {
    items: R.map(sanitizeTransaction, transactions || []),
    total,
    hasMore: total > offset + (transactions?.length || 0)
  };
};

export default withNamespace('userCreditsTransactions', {
  getTransactionsByUser: {
    method: getTransactionsByUser,
    meta: { audit: true }
  },
  listTransactionsByType: {
    method: listTransactionsByType,
    meta: { audit: true }
  },
  getCreditBalanceHistory: {
    method: getCreditBalanceHistory,
    meta: { audit: true }
  },
  getTransactionStats: {
    method: getTransactionStats,
    meta: { audit: true }
  },
  searchTransactions: {
    method: searchTransactions,
    meta: { audit: true }
  }
});
