import {
  createFieldTimeWindow,
  buildMatchStage,
  buildGroupStage,
  buildSortStage,
  bucketByDay,
  sumAbs,
  validateAnalyticsInput
} from '../../../utils/analytics/shared-utils.js';

/**
 * Get daily credit spend totals over the past N days (refactored).
 * @param {Object} deps - Dependencies: CreditTransaction (model)
 * @returns {Function} (userId, { days }) => Promise<{ cacheKey: string, data: Array }>
 */
const getCreditSpendingHistory = ({ CreditTransaction }) => async (userId, { days = 30 } = {}) => {
  validateAnalyticsInput({ requiredFields: ['userId'], dateFields: [] }, { userId });
  const timeWindow = createFieldTimeWindow({ field: 'createdAt', days });

  const pipeline = [
    buildMatchStage({ userId, type: 'spend', ...timeWindow }),
    buildGroupStage(
      { day: bucketByDay('createdAt') },
      { totalSpent: sumAbs('amount'), count: { $sum: 1 } }
    ),
    buildSortStage({ 'day': 1 })
  ];

  const data = await CreditTransaction.aggregate(pipeline);
  return { cacheKey: `creditHistory:${userId}:${days}`, data };
};

export default getCreditSpendingHistory; 