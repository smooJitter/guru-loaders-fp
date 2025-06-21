/**
 * @module user-credits/analytics/query.actions
 * Query actions for user-credits analytics.
 * All actions must be pure, composable, and auditable.
 */

import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';

// TODO: Import action audit utility and Ramda as needed

/**
 * Error messages for user-credits analytics query actions
 */
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
  MISSING_MODEL: 'Model not available in context',
};

const parseDate = (d) => {
  if (!d) return undefined;
  const date = new Date(d);
  return isNaN(date.getTime()) ? undefined : date;
};

const getModel = (context, name) => {
  if (!context?.models?.[name]) throw new Error(`${name} model not available in context`);
  return context.models[name];
};

/**
 * Example query action (replace with real actions)
 * @param {object} context - The request context
 * @returns {Promise<object>} Result
 */
export const exampleQuery = async (context) => {
  // TODO: Implement query logic
  return {};
};

/**
 * Get credit balance history by interval
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {string} [params.interval='day']
 * @param {string} [params.userId]
 * @returns {Promise<Array>} Balance history
 */
export const getCreditBalanceHistory = async ({ context, startDate, endDate, interval = 'day', userId = null }) => {
  const CreditTransaction = getModel(context, 'CreditTransaction');
  const match = {};
  if (userId) match.userId = userId;
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start) match.createdAt = { ...match.createdAt, $gte: start };
  if (end) match.createdAt = { ...match.createdAt, $lte: end };
  const dateFormat = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-%U' : '%Y-%m-%d';
  const pipeline = [
    { $match: match },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        balance: { $last: '$balance' },
        transactions: { $push: '$$ROOT' }
      }
    },
    { $sort: { _id: 1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

/**
 * Get credit usage trends by interval
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {string} [params.interval='month']
 * @returns {Promise<Array>} Usage trends
 */
export const getCreditUsageTrends = async ({ context, startDate, endDate, interval = 'month' }) => {
  const CreditTransaction = getModel(context, 'CreditTransaction');
  const match = {};
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start) match.createdAt = { ...match.createdAt, $gte: start };
  if (end) match.createdAt = { ...match.createdAt, $lte: end };
  const dateFormat = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-%U' : '%Y-%m-%d';
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalTopUp: {
          $sum: {
            $cond: [{ $eq: ['$type', 'top_up'] }, '$amount', 0]
          }
        },
        totalSpend: {
          $sum: {
            $cond: [{ $eq: ['$type', 'spend'] }, { $abs: '$amount' }, 0]
          }
        },
        totalRefund: {
          $sum: {
            $cond: [{ $eq: ['$type', 'refund'] }, '$amount', 0]
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
  return CreditTransaction.aggregate(pipeline);
};

// Barrel export for all query actions
export default withNamespace('userCreditsAnalytics', {
  exampleQuery,
  getCreditBalanceHistory: { method: getCreditBalanceHistory, meta: { audit: true } },
  getCreditUsageTrends: { method: getCreditUsageTrends, meta: { audit: true } },
});
