// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
};

const sanitizeTransaction = (txn) => {
  // Remove MongoDB version key from transaction objects
  if (!txn) return txn;
  const { __v, ...rest } = txn;
  return rest;
};

import { withNamespace } from '../../../src/utils/with-namespace.js';

const getTransactionsByUser = async ({ context, userId, limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = -1 }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
  if (!userId) throw new Error(ERRORS.INVALID_INPUT);
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
    items: transactions.map(sanitizeTransaction),
    total,
    hasMore: total > offset + transactions.length
  };
};

const listTransactionsByType = async ({ context, type, limit = 10, offset = 0 }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
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
    items: transactions.map(sanitizeTransaction),
    total,
    hasMore: total > offset + transactions.length
  };
};

const getCreditBalanceHistory = async ({ context, userId, startDate, endDate, interval = 'day' }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
  const match = { userId };
  if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
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
  return history.map(h => ({
    date: h._id,
    balance: h.lastBalance,
    transaction: sanitizeTransaction(h.lastTxn)
  }));
};

const getTransactionStats = async ({ context, userId, startDate, endDate }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
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

const searchTransactions = async ({ context, query, limit = 10, offset = 0 }) => {
  const { models } = context;
  const CreditTransaction = models.CreditTransaction;
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
    items: transactions.map(sanitizeTransaction),
    total,
    hasMore: total > offset + transactions.length
  };
};

export default withNamespace('userCreditsTransactions', {
  getTransactionsByUser,
  listTransactionsByType,
  getCreditBalanceHistory,
  getTransactionStats,
  searchTransactions
});
