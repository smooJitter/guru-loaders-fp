import { parseISO, subDays } from 'date-fns';
import assert from 'assert';
import CreditTransaction from '../../models/CreditTransaction.js';
import CreditAccount from '../../models/CreditAccount.js';

/**
 * Get daily credit spend totals over the past N days.
 * @param {string} userId
 * @param {Object} params
 * @param {number} [params.days]
 * @returns {Promise<{ cacheKey: string, data: Array }>} 
 */
export const getCreditSpendingHistory = async (userId, { days = 30 } = {}) => {
  assert(userId, 'userId is required');
  const from = subDays(new Date(), days);

  const data = await CreditTransaction.aggregate([
    { $match: { userId, type: 'spend', createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalSpent: { $sum: { $abs: '$amount' } },
        count:      { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return { cacheKey: `creditHistory:${userId}:${days}`, data };
};

/**
 * Get daily trend of both top-ups and spends.
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} [params.days]
 * @returns {Promise<{ cacheKey: string, data: Array }>} 
 */
export const getCreditTrend = async ({ userId, days = 30 } = {}) => {
  assert(userId, 'userId is required');
  const from = subDays(new Date(), days);

  const data = await CreditTransaction.aggregate([
    { $match: { userId, createdAt: { $gte: from } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        breakdown: { $push: { type: '$_id.type', total: '$total' } }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return { cacheKey: `creditTrend:${userId}:${days}`, data };
};

/**
 * List top spenders, with pagination.
 * @param {Object} params
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {number} [params.limit]
 * @param {number} [params.skip]
 * @returns {Promise<Array>} 
 */
export const getTopCreditSpenders = async ({ startDate, endDate, limit = 10, skip = 0 } = {}) => {
  const match = { type: 'spend' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = parseISO(startDate);
    if (endDate)   match.createdAt.$lt  = parseISO(endDate);
  }

  const results = await CreditTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$userId',
        totalSpent: { $sum: { $abs: '$amount' } },
        txnCount:   { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId:     '$_id',
        email:      '$user.email',
        totalSpent: 1,
        txnCount:   1
      }
    }
  ]);
  return results ?? [];
};

/**
 * Bucket users by balance ranges.
 * @returns {Promise<Array>} 
 */
export const getCreditDistribution = async () => {
  const results = await CreditAccount.aggregate([
    {
      $bucket: {
        groupBy: '$balance',
        boundaries: [0,50,100,500,1000,5000,10000],
        default: '>10K',
        output: {
          userCount: { $sum: 1 },
          avg:       { $avg: '$balance' },
          max:       { $max: '$balance' }
        }
      }
    }
  ]);
  return results ?? [];
};

/**
 * Daily + total credit spend (dashboard-ready).
 * @param {string} userId
 * @param {number} [days]
 * @returns {Promise<{ daily: Array, summary: Object }>} 
 */
export const getCreditSpendingWithSummary = async (userId, days = 30) => {
  assert(userId, 'userId is required');
  const fromDate = subDays(new Date(), days);

  const [ result ] = await CreditTransaction.aggregate([
    { $match: { userId, type: 'spend', createdAt: { $gte: fromDate } } },
    {
      $facet: {
        daily: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              spent: { $sum: { $abs: '$amount' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ],
        summary: [
          {
            $group: {
              _id: null,
              total: { $sum: { $abs: '$amount' } },
              days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }
            }
          },
          {
            $project: {
              _id: 0,
              total: 1,
              daysCount: { $size: '$days' }
            }
          }
        ]
      }
    }
  ]);

  return {
    daily:   result.daily   || [],
    summary: (result.summary && result.summary[0]) || { total: 0, daysCount: 0 }
  };
}; 