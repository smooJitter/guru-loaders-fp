import { withNamespace } from '../../../src/utils/with-namespace.js';
import * as R from 'ramda';
import {
  buildAggregationPipeline,
  buildGroupStage,
  buildSortStage,
  safeAggregate,
  bucketByDay
} from '../../utils/analytics/shared-utils.js';

/**
 * Error messages for user-credits transaction analytics
 */
const ERRORS = {
  INVALID_INPUT: 'Invalid input',
  MISSING_MODEL: 'CreditTransaction model not available in context',
  AGGREGATION_ERROR: (action) => `Aggregation failed in ${action}`,
};

const MAX_LIMIT = 100; // # Reason: Prevent excessive DB load

/**
 * Validate and clamp limit
 */
const clampLimit = (limit) => {
  const n = Number(limit);
  return Number.isInteger(n) && n > 0 ? Math.min(n, MAX_LIMIT) : 10;
};

/**
 * Validate and parse date
 */
const parseDate = (d) => {
  if (!d) return undefined;
  const date = new Date(d);
  return isNaN(date.getTime()) ? undefined : date;
};

/**
 * Defensive model getter
 */
const getCreditTransaction = (context) => {
  if (!context?.models?.CreditTransaction) throw new Error(ERRORS.MISSING_MODEL);
  return context.models.CreditTransaction;
};

/**
 * Get transaction count by type
 * Pure, composable, context-injected
 * @param {object} params
 * @param {object} params.context - The request context
 * @returns {Promise<Array>} Count by type
 */
const getTransactionCountByType = async ({ context }) => {
  const CreditTransaction = getCreditTransaction(context);
  try {
    // # Reason: Group by type for reporting
    const pipeline = buildAggregationPipeline({
      groupBy: '$type',
      aggregations: { count: { $sum: 1 } },
      sort: { count: -1 }
    });
    return safeAggregate(await CreditTransaction.aggregate(pipeline));
  } catch (err) {
    throw new Error(`${ERRORS.AGGREGATION_ERROR('getTransactionCountByType')}: ${err.message}`);
  }
};

/**
 * Get transaction volume trend (by day)
 * Pure, composable, context-injected
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @returns {Promise<Array>} Volume trend
 */
const getTransactionVolumeTrend = async ({ context, startDate, endDate }) => {
  const CreditTransaction = getCreditTransaction(context);
  try {
    const match = {};
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start) match.createdAt = { ...match.createdAt, $gte: start };
    if (end) match.createdAt = { ...match.createdAt, $lte: end };
    // # Reason: Group by day for trend analysis
    const pipeline = buildAggregationPipeline({
      match,
      groupBy: { day: bucketByDay('createdAt') },
      aggregations: { totalAmount: { $sum: '$amount' }, count: { $sum: 1 } },
      sort: { 'day': 1 }
    });
    return safeAggregate(await CreditTransaction.aggregate(pipeline));
  } catch (err) {
    throw new Error(`${ERRORS.AGGREGATION_ERROR('getTransactionVolumeTrend')}: ${err.message}`);
  }
};

/**
 * Get top users by total credits transacted
 * Pure, composable, context-injected
 * @param {object} params
 * @param {object} params.context - The request context
 * @param {number} [params.limit=10]
 * @returns {Promise<Array>} Top users
 */
const getTopCreditUsers = async ({ context, limit = 10 }) => {
  const CreditTransaction = getCreditTransaction(context);
  try {
    const clampedLimit = clampLimit(limit);
    // # Reason: Group by userId for leaderboard
    const pipeline = [
      buildGroupStage('$userId', { total: { $sum: '$amount' }, count: { $sum: 1 } }),
      buildSortStage({ total: -1 }),
      { $limit: clampedLimit }
    ];
    return safeAggregate(await CreditTransaction.aggregate(pipeline));
  } catch (err) {
    throw new Error(`${ERRORS.AGGREGATION_ERROR('getTopCreditUsers')}: ${err.message}`);
  }
};

/**
 * Get transaction type breakdown (count and total per type)
 * Pure, composable, context-injected
 * @param {object} params
 * @param {object} params.context - The request context
 * @returns {Promise<Array>} Breakdown by type
 */
const getTransactionTypeBreakdown = async ({ context }) => {
  const CreditTransaction = getCreditTransaction(context);
  try {
    // # Reason: Breakdown for reporting and dashboard
    const pipeline = [
      buildGroupStage('$type', { count: { $sum: 1 }, total: { $sum: '$amount' } }),
      buildSortStage({ count: -1 })
    ];
    return safeAggregate(await CreditTransaction.aggregate(pipeline));
  } catch (err) {
    throw new Error(`${ERRORS.AGGREGATION_ERROR('getTransactionTypeBreakdown')}: ${err.message}`);
  }
};

/**
 * Get transaction activity timeline (placeholder)
 * Pure, composable, context-injected
 * @param {object} params
 * @returns {Promise<Array>} Empty array (to be implemented)
 */
const getTransactionActivityTimeline = async ({ context, userId }) => {
  // TODO: Implement activity log or transaction history timeline
  return [];
};

// TODO: Add group by tenant, role, or other custom fields for multi-tenant analytics

export default withNamespace('userCreditsTransactionAnalytics', {
  getTransactionCountByType: { method: getTransactionCountByType, meta: { audit: true } },
  getTransactionVolumeTrend: { method: getTransactionVolumeTrend, meta: { audit: true } },
  getTopCreditUsers: { method: getTopCreditUsers, meta: { audit: true } },
  getTransactionTypeBreakdown: { method: getTransactionTypeBreakdown, meta: { audit: true } },
  getTransactionActivityTimeline: { method: getTransactionActivityTimeline, meta: { audit: true } }
});

export {
  getTransactionCountByType,
  getTransactionVolumeTrend,
  getTopCreditUsers,
  getTransactionTypeBreakdown,
  getTransactionActivityTimeline
}; 